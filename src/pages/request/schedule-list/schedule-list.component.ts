import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, Events, ActionSheetController, AlertController, ToastController, ModalController } from 'ionic-angular';
import { Network } from '@ionic-native/network';
import { RequestAssignPage } from '../request-assign/request-assign.component';
import { RequestEditServicesPage } from '../request-edit-services/request-edit-services.component';
import { UserPublicProfilePage } from '../../user/user-public-profile/user-public-profile.component';
import { HorsePublicProfilePage } from '../../horse/horse-public-profile/horse-public-profile.component';
import { ScheduleFilterPage } from '../schedule-filter/schedule-filter.component';
import { RequestService } from '../../request/request.service';
import { Request } from '../../request/request';
import { User } from '../../user/user';
import { Horse } from '../../horse/horse';
import { UserService } from '../../user/user.service';
import { AuthService } from '../../auth/auth.service';
import { HorseService } from '../../horse/horse.service';
import { ConstantsService } from '../../../providers/constants.service';
import moment from 'moment';
import _ from 'lodash';

@Component({
  selector: 'page-schedule-list',
  templateUrl: 'schedule-list.html',
})

export class ScheduleListPage implements OnInit {
  scheduleFilterPage: any = ScheduleFilterPage;
  chosenSegment: string;
  currentPage: number;
  itemsPerPage: number;
  canLoadMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  lastRefresh: any;
  requests: any[] = [];
  todayRequests: any[] = [];
  groupedRequests: Request[] = [];
  filterSort: string;
  filterStartDate: string;
  filterEndDate: string;

  constructor(
    public actionSheetCtrl: ActionSheetController,
    public navCtrl: NavController,
    public navParams: NavParams,
    public constants: ConstantsService,
    public alertCtrl: AlertController,
    public events: Events,
    public requestService: RequestService,
    public userService: UserService,
    public authService: AuthService,
    public horseService: HorseService,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    private network: Network,
  ) {
    this.chosenSegment = 'current';

    this.currentPage = 0;
    this.itemsPerPage = 20;
    this.canLoadMore = true;

    this.events.subscribe('user:logged-in', () => {
      this.refreshList();
    });

    this.events.subscribe('request:created/updated', () => {
      this.refreshList();
    });
  }

  ngOnInit(): void {
    this.lastRefresh = moment();
    this.getTodayRequests();
    this.findAll();
  }

  /**
   * Retrieves items and item count and manages infinite scroll for lists
   * @param  {$event} InfiniteScroll The optional infiniteScroll event
   * @param  {$event} Refresher The optional refresher event
   */
  async findAll(infiniteScroll?: any, refresher?: any) {
    this.isLoading = true;

    let skip = this.itemsPerPage * this.currentPage;
    const params: any = {
      limit: this.itemsPerPage,
      skip: skip,
    };

    if (this.filterSort) {
      params.sort = this.filterSort;
    }

    if (this.filterStartDate) {
      params.startDate = this.filterStartDate;
    }

    if (this.filterEndDate) {
      params.endDate = this.filterEndDate;
    }

    if (this.chosenSegment === 'current') {
      params.upcoming = true;
    }

    if (this.chosenSegment === 'past') {
      if (!this.filterSort) { params.sort = '-date'; }
      params.past = true;
    }

    try {
      const response = await this.requestService.querySchedule(params);

      this.currentPage += 1;

      // Once the number of items returned is less than items per page it's time to stop
      if (response.length < this.itemsPerPage) {
        this.canLoadMore = false;
      }

      // Concat the response to our model list data
      this.requests = this.requests.concat(response);

      // Group requests by date
      this.groupedRequests = _.chain(this.requests).groupBy('dateOnly').toPairs().value();

      // Stop the infiniteScroll and refresher when complete
      if (infiniteScroll) { infiniteScroll.complete(); }
      if (refresher) { refresher.complete(); }
      this.isLoading = false;
      this.isRefreshing = false;
    } catch (error) {
      this.canLoadMore = false;
      this.isLoading = false;
      const message = error.json().message || 'There was an error.';
      this.requestService.handleError(message);
    }
  }

  /**
   * Gets all requests scheduled for today
   */
  async getTodayRequests() {
    try {
      const params: any = {
        today: true,
        limit: 100, // Setting a high limit because we want all requests for the day
      };

      if (this.filterSort) {
        params.sort = this.filterSort;
      }

      if (this.filterStartDate) {
        params.startDate = this.filterStartDate;
      }

      if (this.filterEndDate) {
        params.endDate = this.filterEndDate;
      }

      const requests = await this.requestService.querySchedule(params);

      // Concat the response to our model list data
      this.todayRequests = requests;

    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.requestService.handleError(message);
    }
  }

  /**
   * Refresh list by setting variables back to our blank state
   * @param  {$event} Refresher The refresher event
   */
  refreshList(refresher?: any): void {
    if (this.network.type !== this.constants.NO_NETWORK) {
      // Clear variables
      this.isRefreshing = true;
      this.canLoadMore = true;
      this.currentPage = 0;
      this.requests = [];

      this.lastRefresh = moment();

      this.findAll(refresher);

      // Only get today's requests if no filter date set and upcoming segment chosen
      if (this.chosenSegment !== 'past' && !this.filterStartDate && !this.filterEndDate) {
        this.getTodayRequests();
      }

    } else {
      // Stop the refresher
      if (refresher) { refresher.complete(); }

      // Let user know there is no connection and do not refresh list
      const message = 'There is currently no internet connection. Please try again later.';
      this.requestService.handleError(message);
    }
  }

  /**
   * Reload the list when the segment is changed
   * @param event Event
   */
  segmentChanged(event: Event) {
    this.refreshList();
  }

  openActionSheet(request: Request) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Job Options',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
     });

    // If request is pending && user is main service provider or
    // add Decline Job option
    if ((this.requestService.isPending(request)) &&
      (((this.isMainServiceProvider(request) && !request._reassignedTo)) ||
      (this.isReassignedServiceProvider(request)))) {
      actionSheet.addButton({
        text: 'Decline Job',
        handler: () => {
          this.updateStatus(request, this.constants.STATUSES.decline);
        },
      });
    }

    // If request was reassigned but declined by reassignee
    if (this.isMainServiceProvider(request) && request._reassignedTo && request.declinedAt) {
      actionSheet.addButton({
        text: 'Reject Job',
        role: 'destructive',
        handler: () => {
          this.updateStatus(request, this.constants.STATUSES.leave);
        },
      });
    }

    // If request is pending, user is main service provider, and it's been reassigned
    if (this.requestService.isPending(request) &&
      this.isMainServiceProvider(request) &&
      request._reassignedTo) {
      actionSheet.addButton({
        text: 'Assign Job to Someone Else',
        handler: () => {
          this.goToAssignJob(request);
        },
      });
    }

    // If request has been accepted, add options to add services or decline job
    if (this.requestService.isAccepted(request)) {
      actionSheet.addButton({
        text: 'View Notes / Add Services',
        handler: () => {
          this.addServices(request);
        },
      });

      // If user is main service provider with no reassign
      // Or user is the reassignee
      if ((this.isMainServiceProvider(request) && !request._reassignedTo) ||
        (this.isReassignedServiceProvider(request))) {
        actionSheet.addButton({
          text: 'Reject Job',
          role: 'destructive',
          handler: () => {
            this.updateStatus(request, this.constants.STATUSES.leave);
          },
        });
      }
    }

    actionSheet.present();
  }

  /**
   * Confirm that user wants to mark job as complete and then update status
   * @param {Request} request [description]
   */
  confirmComplete(request: Request) {
    let confirm = this.alertCtrl.create({
      title: 'Mark this job as Complete?',
      message: 'This action cannot be undone. Once a job is marked complete, it will be moved into the payments tab.',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            this.updateStatus(request, this.constants.STATUSES.complete);
          },
        },
      ],
    });

    confirm.present();
  }

  /**
   * Update status of a request
   * Don't allow a user to accept a job if they don't have payment information setup
   * @param {Request} request The Request object
   */
  async updateStatus(request: Request, status: string) {
    if (!this.authService.hasPaymentSetup()) {
      this.showPaymentAlert();
      return;
    }

    try {
      const updatedRequest = await this.requestService.updateStatus(request, status);

      // Update or remove request in list
      if (status === this.constants.STATUSES.decline || status === this.constants.STATUSES.leave) {
        this.removeRequestFromList(updatedRequest);
      } else {
        this.updateRequestList(updatedRequest);
      }

      // Refresh the payment list after completing a request
      if (status === this.constants.STATUSES.complete) {
        this.events.publish('invoice:created/updated');
      }

      const toast = this.toastCtrl.create({
        message: `The request status has been updated.`,
        duration: 3000,
        cssClass: 'toast-success',
      });
      toast.present();
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.requestService.handleError(message);
    }
  }

  /**
   * Update a given request in either the list of requests for today or the requests
   * grouped by date
   * @param {Request} request The Request object
   */
  updateRequestList(request: Request) {
    // If request exists in this.todayRequests, update it
    let todayIndex = this.todayRequests.findIndex((o) => o._id === request._id);
    if (todayIndex > -1) {
      this.todayRequests[todayIndex] = request;
    }

    // If request exists in this.groupedRequests, update it
    this.groupedRequests.forEach((group) => {
      let groupedIndex = group[1].findIndex((o) => o._id === request._id);
      if (groupedIndex > -1) {
        group[1][groupedIndex] = request;
      }
    });
  }

  async addServices(request: Request) {
    const requestEditServicesModal = this.modalCtrl.create(RequestEditServicesPage, { id: request._id }, { enableBackdropDismiss: false });
    requestEditServicesModal.present();
  }

  async dismissRequest(request: Request) {
    try {
      const updatedRequest = await this.requestService.dismiss(request);

      // Remove request in list
      this.removeRequestFromList(updatedRequest);

    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.requestService.handleError(message);
    }
  }

  /**
   * Remove a given request in either the list of requests for today or the requests
   * grouped by date
   * @param {Request} request The Request object
   */
  removeRequestFromList(request: Request) {
    // If request exists in this.todayRequests, remove it
    let todayIndex = this.todayRequests.findIndex((o) => o._id === request._id);
    if (todayIndex > -1) {
      this.todayRequests.splice(todayIndex, 1);
    }

    // If request exists in this.groupedRequests, remove it
    this.groupedRequests.forEach((group, i) => {
      let groupedIndex = group[1].findIndex((o) => o._id === request._id);
      if (groupedIndex > -1) {
        group[1].splice(groupedIndex, 1);
      }

      // Remove date grouping if there are no more items left in group
      if (!group[1].length) {
        this.groupedRequests.splice(i, 1);
      }
    });
  }

  /**
   * Check if currentUser is the main service provider for a request
   * @param {Request} request The request object
   */
  isMainServiceProvider(request: Request) {
    return (this.authService.currentUser._id === request._serviceProvider._id) &&
      (!request._reassignedTo || this.authService.currentUser._id !== request._reassignedTo._id);
  }

  /**
   * Check if currentUser is the reassigned service provider
   * @param {Request} request The request object
   */
  isReassignedServiceProvider(request: Request) {
    return (this.authService.currentUser._id !== request._serviceProvider._id) &&
      (request._reassignedTo && this.authService.currentUser._id === request._reassignedTo._id);
  }

  /**
   * Go to the assign modal
   * Don't allow the user to move forward if payments are not configured
   * @param request The request object
   */
  goToAssignJob(request: Request) {
    if (!this.authService.hasPaymentSetup()) {
      this.showPaymentAlert();
      return;
    }

    const requestAssignModal = this.modalCtrl.create(RequestAssignPage, { id: request._id }, { enableBackdropDismiss: false });
    requestAssignModal.present();
  }

  /**
   * Go to public profile for a user
   * @param {User}       user The user object
   * @param {boolean = true}        hideInfo True if contact info should be hidden
   */
  goToPublicProfile(user: User, hideInfo: boolean = true) {
    const data = {
      userId: user._id,
      hideContactInfo: hideInfo,
    };

    const publicProfileModal = this.modalCtrl.create(UserPublicProfilePage, data, { enableBackdropDismiss: false });
    publicProfileModal.present();
  }

  /**
   * Go to public profile for a horse
   * @param {Horse}       horse The horse object
   */
  goToHorsePublicProfile(horse: Horse) {
    const data = {
      horseId: horse._id,
    };

    const horsePublicProfileModal = this.modalCtrl.create(HorsePublicProfilePage, data, { enableBackdropDismiss: false });
    horsePublicProfileModal.present();
  }

  /**
   * Open the filter modal and handle the response on dismiss
   */
  openFilter(): void {
    const params = {
      filterSort: this.filterSort,
      filterStartDate: this.filterStartDate,
      filterEndDate: this.filterEndDate,
    };

    const filterModal = this.modalCtrl.create(this.scheduleFilterPage, params);
    filterModal.present();

    // Callback when modal is closed
    filterModal.onDidDismiss((data) => {
      if (data) {
        if (this.network.type !== this.constants.NO_NETWORK) {
          this.filterSort = data.sort;
          this.filterStartDate = data.startDate;
          this.filterEndDate = data.endDate;

          this.canLoadMore = true;
          this.currentPage = 0;
          this.lastRefresh = moment();

          this.todayRequests = [];
          this.requests = [];

          if ((!data.startDate && !data.endDate) && this.chosenSegment !== 'past') {
            this.getTodayRequests();
          }

          this.findAll();
        } else {
          const message = 'There is currently no internet connection. Please try again later.';
          this.requestService.handleError(message);
        }
      }
    });
  }

  showPaymentAlert() {
    this.alertCtrl.create({
      title: 'First Add Payment Method',
      subTitle: 'You need to complete your payment information in your profile before you may proceed.',
      buttons: ['Okay'],
    }).present();
  }
}
