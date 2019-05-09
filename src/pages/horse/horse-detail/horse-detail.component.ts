import { Component, OnInit } from '@angular/core';
import { Network } from '@ionic-native/network';
import { NavController, ViewController, AlertController, NavParams, ActionSheetController,
  ToastController, ModalController, Events } from 'ionic-angular';
import { Horse } from '../horse';
import { HorseService } from '../horse.service';
import { UserService } from '../../user/user.service';
import { AuthService } from '../../auth/auth.service';
import { RequestService } from '../../request/request.service';
import { HorseListPage } from '../horse-list/horse-list.component';
import { UserPublicProfilePage } from '../../user/user-public-profile/user-public-profile.component';
import { HorseEditPage } from '../horse-edit/horse-edit.component';
import { RequestNewPage } from '../../request/request-new/request-new.component';
import { RequestEditPage } from '../../request/request-edit/request-edit.component';
import { CustomInvoiceNewPage } from '../../invoice/custom-invoice-new/custom-invoice-new.component';
import { HorsePrivateNoteFormPage } from '../horse-private-note-form/horse-private-note-form.component';
import { Request } from '../../request/request';
import { User } from '../../user/user';
import { ConstantsService } from '../../../providers/constants.service';
import moment from 'moment';
import _ from 'lodash';

@Component({
  selector: 'page-horse-detail',
  templateUrl: 'horse-detail.html',
})

export class HorseDetailPage implements OnInit {
  requestNewPage: any = RequestNewPage;
  customInvoiceNewPage: any = CustomInvoiceNewPage;
  isLoading: boolean;
  isRefreshing: boolean;
  lastRefresh: any;
  currentPage: number;
  itemsPerPage: number;
  canLoadMore: boolean;
  isLoadingRequests: boolean;
  requests: Request[] = [];
  groupedRequests: Request[] = [];
  user: User;
  privateNote: string;

  constructor(
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public horseService: HorseService,
    public userService: UserService,
    public authService: AuthService,
    public requestService: RequestService,
    public constants: ConstantsService,
    public actionSheetCtrl: ActionSheetController,
    private toastCtrl: ToastController,
    public modalCtrl: ModalController,
    private network: Network,
    public events: Events,
    public alertCtrl: AlertController,
   ) {
    this.currentPage = 0;
    this.itemsPerPage = 20;
    this.canLoadMore = true;

    this.lastRefresh = moment();

    // When user logs out, make sure the list view is the first view upon re-entering
    this.events.subscribe('user:logged-out', () => {
      this.navCtrl.popToRoot();
    });

    // Dismiss view if horse has been deleted
    this.events.subscribe('horse:deleted', () => {
      this.viewCtrl.dismiss();
    });
  }

  ngOnInit(): void {
    this.horseService.horse = null;
    this.findOne();
    this.lastRefresh = moment();
    this.user = this.authService.currentUser;
  }

  /**
   * Clear request variables and refresh list/find horse
   * @param {any} refresher [description]
   */
  refresh(refresher?: any) {
    if (this.network.type !== this.constants.NO_NETWORK) {
      // Clear variables
      this.isRefreshing = true;
      this.canLoadMore = true;
      this.currentPage = 0;
      this.requests = [];

      this.lastRefresh = moment();
      this.findOne(refresher);
    } else {
      // Stop the refresher
      if (refresher) { refresher.complete(); }

      // Let user know there is no connection and do not refresh list
      const message = 'There is currently no internet connection. Please try again later.';
      this.horseService.handleError(message);
    }
  }

  /**
   * Retrieves one item and sets to this.horse
   */
  async findOne(refresher?: any) {
    this.isLoading = true;
    const horseId = this.navParams.get('id');

    try {
      const horse = await this.horseService.get(horseId);

      this.isLoading = false;
      this.horseService.horse = horse;

      // Get all upcoming requests for this horse
      this.findAllRequests(refresher);
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.horseService.handleError(message);
      this.navCtrl.push(HorseListPage);
    }
  }

  /**
   * Retrieves items and item count and manages infinite scroll for lists
   * @para {$event} InfiniteScroll The optional infiniteScroll event
   * @param  {$event} Refresher The optional refresher event
   */
  async findAllRequests(infiniteScroll?: any, refresher?: any) {
    this.isLoadingRequests = true;
    let skip = this.itemsPerPage * this.currentPage;

    try {
      const requests = await this.requestService.query({
        limit: this.itemsPerPage,
        skip: skip,
        upcoming: true,
        outstanding: true,
        horse: this.horseService.horse._id,
      });

      this.currentPage += 1;

      // Once the number of items returned is less than items per page it's time to stop
      if (requests.length < this.itemsPerPage) {
        this.canLoadMore = false;
      }

      // Concat the response to our model list data
      this.requests = this.requests.concat(requests);

      // Group requests by date
      this.groupedRequests = _.chain(this.requests).groupBy('dateOnly').toPairs().value();

      // Stop the infiniteScroll when complete
      if (infiniteScroll) { infiniteScroll.complete(); }

      // Stop the refresher when complete
      if (refresher) { refresher.complete(); }

      this.isLoadingRequests = false;
      this.isRefreshing = false;
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.horseService.handleError(message);
    }
  }

  goToEditModal(request: Request) {
    // Set request in request service
    this.requestService.request = request;

    const params = {
      horseId: this.navParams.get('id'),
      updatingServiceProvider: true,
    };

    const requestEditModal = this.modalCtrl.create(RequestEditPage, params, { enableBackdropDismiss: false });
    requestEditModal.present();
  }

  /**
   * Open action sheet with edit and delete buttons from a request
   * @param {Request} request The Request object
   */
  openRequestActionSheet(request: Request) {
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Service Request Options',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
      ],
     });

    // Only add an edit button if the request has not been declined
    if (!request.declinedByHeadServiceProvider) {
      actionSheet.addButton({
        text: 'Edit',
        handler: () => {
          // Set request in request service
          this.requestService.request = request;

          const horse = this.horseService.horse;
          const requestEditModal = this.modalCtrl.create(RequestEditPage, { horse: horse }, { enableBackdropDismiss: false });
          requestEditModal.present();
        },
      });
    }

    // Add delete button
    actionSheet.addButton({
      text: 'Delete',
      role: 'destructive',
      handler: () => {
        this.removeRequest(request);
      },
    });

    actionSheet.present();
  }

  /**
   * Go to the new request modal
   * If the user doesn't have payments setup show alert instead
   */
  goToRequestNew() {
    if (!this.authService.hasPaymentSetup()) {
      this.showPaymentAlert();
      return;
    }

    const horse = this.horseService.horse;
    const requestNewModal = this.modalCtrl.create(RequestNewPage, { horse: horse }, { enableBackdropDismiss: false });
    requestNewModal.present();

    // Refresh the list
    requestNewModal.onDidDismiss((data) => {
      if (data && data.refreshHorseDetail) {
        this.refresh();
      }
    });
  }

  goToCustomInvoiceNew() {
    if (!this.authService.hasPaymentSetup()) {
      this.showPaymentAlert();
      return;
    }

    const horse = this.horseService.horse;
    const customInvoiceNewModal = this.modalCtrl.create(CustomInvoiceNewPage, { horse: horse }, { enableBackdropDismiss: false });
    customInvoiceNewModal.present();

    // Refresh the list
    customInvoiceNewModal.onDidDismiss((data) => {
      if (data && data.refreshHorseDetail) {
        this.refresh();
      }
    });
  }

  noteForHorse() {
    if (!this.user.privateNotes) {
      this.user.privateNotes = [];
    }

    return this.user.privateNotes.find((noteObj) => {
      return noteObj._horse === this.horseService.horse._id;
    });
  }

  updatePrivateNote() {
    const horsePrivateNoteModal = this.modalCtrl.create(HorsePrivateNoteFormPage, null, { enableBackdropDismiss: false });
    horsePrivateNoteModal.present();
  }

  /**
   * Removes a request
   * @param  {Object} Request to be deleted
   */
  removeRequest(request: Request) {
    let confirm = this.alertCtrl.create({
      title: 'Really Delete?',
      message: 'Are you sure you want to delete this request?',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            this.requestService.delete(request._id)
              .then((response) => {

                // Remove request from this.requests and re-group by date
                let index = this.requests.findIndex((o) => o._id === request._id);
                if (index > -1) {
                  this.requests.splice(index, 1);
                }
                this.groupedRequests = _.chain(this.requests).groupBy('dateOnly').toPairs().value();

                // Confirm success
                const toast = this.toastCtrl.create({
                  message: 'Your request has been deleted.',
                  duration: 3000,
                  cssClass: 'toast-success',
                });

                toast.present();
              })
              .catch((error) => {
                const message = error.json().message || 'There was an error.';
                this.horseService.handleError(message);
              });
          },
        },
      ],
    });

    confirm.present();
  }

  /**
   * Check request to see if it should be editable
   * Only a pending or accepted request should be editable
   * @param {Request} request [description]
   */
  requestEditable(request: Request) {
    const isPending = !request.acceptedAt && !request.declinedAt && !request.completedAt;
    const isAccepted = request.acceptedAt && !request.completedAt;
    const isDeclined = request.declinedAt;

    return (isPending || isAccepted || isDeclined);
  }

  goToHorseEdit() {
    const horseEditModal = this.modalCtrl.create(HorseEditPage, null, { enableBackdropDismiss: false });
    horseEditModal.present();
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
   * Present "missing payment" alert
   */
  showPaymentAlert() {
    this.alertCtrl.create({
      title: 'First Add Payment Method',
      subTitle: 'You need to complete your payment information in your profile before you may proceed.',
      buttons: ['Okay'],
    }).present();
  }

  isLeasedToOtherUser(horse: Horse) {
    return horse._leasedTo &&
      horse._leasedTo._id !== this.authService.currentUser._id;
  }

  hasHorseDetails() {
    if (this.horseService.horse) {
      return this.horseService.horse.registrations.length ||
        this.horseService.horse.sire ||
        this.horseService.horse.dam ||
        this.horseService.horse.color ||
        this.horseService.horse.height;
    }
  }

  /**
   * Check if logged in user can edit the horse
   * @param {User} user The User object
   */
  canEditHorse(user: User) {
    if (this.horseService.horse) {
      const ownerIds = this.horseService.horse._owners.map((owner) => String(owner._user._id));
      const ownerIndex = ownerIds.indexOf(this.authService.currentUser._id);

      const trainerId = this.horseService.horse._trainer ? this.horseService.horse._trainer._id : null;

      return ownerIndex > -1 || user._id === trainerId;
    }
  }
}
