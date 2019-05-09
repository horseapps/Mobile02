import { Component } from '@angular/core';
import { NavController, NavParams, ItemSliding, Events, ModalController } from 'ionic-angular';
import { Horse } from '../horse';
import { HorseNewPage } from '../horse-new/horse-new.component';
import { HorseDetailPage } from '../horse-detail/horse-detail.component';
import { HorseFilterPage } from '../horse-filter/horse-filter.component';
import { HorseService } from '../horse.service';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../user/user';
import { AlertController } from 'ionic-angular';
import { ConstantsService } from '../../../providers/constants.service';

@Component({
  selector: 'page-horse-list',
  templateUrl: 'horse-list.html',
})

export class HorseListPage {
  horsesUpcomingRequests: Horse[];
  horseIdsUpcoming: any[];
  currentPage: number;
  itemsPerPage: number;
  canLoadMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;
  horseNewPage: any = HorseNewPage;
  horseDetailPage: any = HorseDetailPage;
  horseFilterPage: any = HorseFilterPage;
  filterSort: string;
  filterOwner: string;
  filterTrainer: string;
  shownGroup: any;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public constants: ConstantsService,
    public alertCtrl: AlertController,
    public modalCtrl: ModalController,
    public horseService: HorseService,
    public authService: AuthService,
    public events: Events,
  ) {
    this.shownGroup = null;
    this.currentPage = 0;
    this.itemsPerPage = 20;
    this.canLoadMore = true;

    // Clear filter on logout
    this.events.subscribe('user:logged-out', () => {
      this.filterSort = null;
      this.filterOwner = null;
      this.filterTrainer = null;
    });
  }

  ionViewDidEnter() {
    if (this.authService.currentUser && (!this.horseService.horses || !this.horseService.horses.length)) {
      this.refreshList();
    }
  }

  // object checking via ngIf is spotty in the HTML, so check for trainer presence via function
  listedHorseHasTrainer(horse: any) {
    return horse._trainer && horse._trainer && horse._trainer.name;
  }

  // object checking via ngIf is spotty in the HTML, so check for barn presence via function
  listedHorseHasBarn(horse: any) {
    return horse._trainer && horse._trainer && horse._trainer.barn;
  }

  getHorsesUpcomingRequests(): void {
    const params: any = {};

    if (this.filterOwner) {
      params._owner = this.filterOwner;
    }

    if (this.filterTrainer) {
      params._trainer = this.filterTrainer;
    }

    this.horseService.getUpcoming(params)
      .then((response) => {
        this.horsesUpcomingRequests = response;
        this.horseIdsUpcoming = response.map((horse) => String(horse._id));
      })
      .catch((error) => {
        const message = error.json().message || 'There was an error.';
        this.horseService.handleError(message);
      });
  }

  /**
   * Retrieves items and item count and manages infinite scroll for lists
   * * @param  {$event} InfiniteScroll The optional infiniteScroll event
   * * @param  {$event} Refresher The optional refresher event
   */
  findAll(infiniteScroll?: any, refresher?: any): void {
    this.isLoading = true;
    let skip = this.itemsPerPage * this.currentPage;

    const params: any = { limit: this.itemsPerPage, skip: skip };

    if (this.filterSort) {
      params.sort = this.filterSort;
    }

    if (this.filterOwner) {
      params._owner = this.filterOwner;
    }

    if (this.filterTrainer) {
      params._trainer = this.filterTrainer;
    }

    if (this.authService.isServiceProvider()) {
      params.serviceable = true;
    }

    this.horseService.query(params)
      .then((response) => {
        this.currentPage += 1;

        // Once the number of items returned is less than items per page it's time to stop
        if (response.length < this.itemsPerPage) {
          this.canLoadMore = false;
        }

        // Concat the response to our model list data
        this.horseService.horses = this.horseService.horses.concat(response);
        // Stop the infiniteScroll and refresher when complete
        if (infiniteScroll) { infiniteScroll.complete(); }
        if (refresher) { refresher.complete(); }

        this.isLoading = false;
        this.isRefreshing = false;
      })
      .catch((error) => {
        this.canLoadMore = false;
        this.isLoading = false;
        this.isRefreshing = false;

        const message = error.json().message || 'There was an error.';
        this.horseService.handleError(message);
      });
  }

  toggleGroup(group: any) {
    if (this.isGroupShown(group)) {
      this.shownGroup = null;
    } else {
      this.shownGroup = group;
    }
  }

  isGroupShown(group: any) {
    return this.shownGroup === group;
  }

  clearLastHorse() {
    this.horseService.horse = null;
  }
  /**
   * Refresh list by setting variables back to our blank state
   * @param  {$event} Refresher The refresher event
   */
  refreshList(refresher?: any): void {
    this.isRefreshing = true;
    this.canLoadMore = true;
    this.currentPage = 0;
    this.horseService.horses = [];
    this.horsesUpcomingRequests = [];

    this.findAll(refresher);
    this.getHorsesUpcomingRequests();
  }

  /**
   * Check if a given horse has an upcoming service
   * @param  {Horse}   horse The horse object
   * @return {boolean}       True/False
   */
  noUpcomingService(horse: Horse): boolean {
    // If a horse from the main list is in the upcoming service ids, hide in main list
    if (this.horseIdsUpcoming && this.horseIdsUpcoming.length) {
      const index = this.horseIdsUpcoming.findIndex((id) => id === String(horse._id));
      if (index > -1) {
        return false;
      } else {
        return true;
      }
    } else {
      return true;
    }
  }

  /**
   * Open the filter modal and handle the response on dismiss
   */
  openFilter(): void {
    const params = {
      filterSort: this.filterSort,
      filterOwner: this.filterOwner,
      filterTrainer: this.filterTrainer,
    };

    const filterModal = this.modalCtrl.create(this.horseFilterPage, params);
    filterModal.present();

    // Callback when modal is closed
    filterModal.onDidDismiss((data) => {
      if (data) {
        this.filterSort = data.sort;
        this.filterOwner = data.owner;
        this.filterTrainer = data.trainer;

        this.canLoadMore = true;
        this.currentPage = 0;
        this.horseService.horses = [];
        this.horsesUpcomingRequests = [];
        this.getHorsesUpcomingRequests();
        this.findAll();
      }
    });
  }

  /**
   * Find horse in horse list with upcoming requests and return the next braiding date
   */
  getServiceDate(horseId: string): string {
    let index = this.horsesUpcomingRequests.findIndex((o) => o._id === horseId);
    if (index > -1) {
      return this.horsesUpcomingRequests[index].nextBraiding;
    }
  }

  goToHorseNew() {
    const horseNewModal = this.modalCtrl.create(HorseNewPage, null, { enableBackdropDismiss: false });
    horseNewModal.present();
  }
}
