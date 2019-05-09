import { Component, OnInit } from '@angular/core';
import { NavController, NavParams, Events, ModalController, AlertController } from 'ionic-angular';
import { Invoice } from '../invoice';
import { CustomInvoiceNewPage } from '../custom-invoice-new/custom-invoice-new.component';
import { InvoiceExportPage } from '../invoice-export/invoice-export.component';
import { InvoiceService } from '../invoice.service';
import { RequestService } from '../../request/request.service';
import { HorseService } from '../../horse/horse.service';
import { AuthService } from '../../auth/auth.service';
import { User } from '../../user/user';
import { Storage } from '@ionic/storage';
import { ConstantsService } from '../../../providers/constants.service';
import { UtilityService } from '../../../providers/utility.service';
import { InvoiceDetailPage } from '../invoice-detail/invoice-detail.component';

@Component({
  selector: 'page-invoice-list',
  templateUrl: 'invoice-list.html',
})

export class InvoiceListPage implements OnInit {
  chosenSegment: string;
  outstandingSegmentName: string;
  completedSegmentName: string;
  itemsPerPage: number;
  currentPage: number;
  canLoadMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;

  constructor(
    public navCtrl: NavController,
    public navParams: NavParams,
    public constants: ConstantsService,
    public utilityService: UtilityService,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public invoiceService: InvoiceService,
    public requestService: RequestService,
    public horseService: HorseService,
    public authService: AuthService,
    public events: Events,
    public storage: Storage,
  ) {
    this.currentPage = 0;
    this.itemsPerPage = 20;
    this.canLoadMore = true;

    this.events.subscribe('user:logged-in', () => {
      this.setSegmentNames();
      this.refreshList();
    });

    this.events.subscribe('invoice:created/updated', () => {
      this.refreshList();
    });
  }

  // Change the segment names based on user role
  setSegmentNames() {
    if (this.authService.isServiceProvider()) {
      this.chosenSegment = 'draft';
      this.outstandingSegmentName = 'Submitted';
      this.completedSegmentName = 'Paid';
    } else {
      this.chosenSegment = 'outstanding';
      this.outstandingSegmentName = 'Outstanding';
      this.completedSegmentName = 'Completed';
    }
  }

  async ngOnInit() {
    // Make sure we have the latest Stripe percentage fee
    this.constants.setStripeFee();
  }

  async ionViewDidEnter() {
    const token = await this.storage.get('token');
    // If there is no current user, get it, so we can set the segments correctly
    if (this.authService.currentUser) {
      this.setSegmentNames();
    } else if (token) {
      this.authService.currentUser = await this.authService.getCurrentUser();
      this.setSegmentNames();
    }
  }

  /**
   * Retrieves items and item count and manages infinite scroll for lists
   * * @param  {$event} InfiniteScroll The optional infiniteScroll event
   * * @param  {$event} Refresher The optional refresher event
   */
  findAll(infiniteScroll?: any, refresher?: any): void {
    this.isLoading = true;
    let skip = this.itemsPerPage * this.currentPage;

    const params: {
      limit: number,
      skip: number,
      serviceProvider?: boolean,
      horseManager?: boolean,
      outstanding?: boolean,
      complete?: boolean,
    } = {
      limit: this.itemsPerPage,
      skip: skip,
    };

    // Set params based on user role and segment selection
    if (this.authService.isServiceProvider()) {
      params.serviceProvider = true;
    } else if (this.authService.isManager()) {
      params.horseManager = true;
    }

    let queryService: string = '';
    let queryFunction: string = '';
    if (this.chosenSegment === 'outstanding') {
      params.outstanding = true;
      queryService = 'invoiceService';
      queryFunction = 'query';
    } else if (this.chosenSegment === 'completed') {
      params.complete = true;
      queryService = 'invoiceService';
      queryFunction = 'query';
    } else if (this.chosenSegment === 'draft') {
      queryService = 'requestService';
      queryFunction = 'queryWithGroups';
    }

    this[queryService][queryFunction](params)
      .then((response) => {
        this.currentPage += 1;

        // Once the number of items returned is less than items per page it's time to stop
        if (response.length < this.itemsPerPage) {
          this.canLoadMore = false;
        }

        // Concat the response to our model list data
        if (this.chosenSegment !== 'draft') {
          this.invoiceService.invoices = this.invoiceService.invoices.concat(response);
        } else if (this.chosenSegment === 'draft') {
          this.requestService.groupedRequests = this.requestService.groupedRequests.concat(response);
        }

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
        this.utilityService.errorToast(message);
      });
  }

  /**
   * Refresh list by setting variables back to our blank state
   * @param  {$event} Refresher The refresher event
   */
  refreshList(refresher?: any): void {
    refresher ? this.isRefreshing = true : this.isRefreshing = false;
    this.canLoadMore = true;
    this.currentPage = 0;
    this.invoiceService.invoices = [];
    this.requestService.groupedRequests = [];
    this.findAll(refresher);
  }

  /**
   * Reload the list when the segment is changed
   * @param event Event
   */
  segmentChanged(event: Event) {
    this.refreshList();
  }

  goToCustomInvoiceNew() {
    if (!this.authService.hasPaymentSetup()) {
      this.showPaymentAlert();
      return;
    }

    const customInvoiceNewModal = this.modalCtrl.create(CustomInvoiceNewPage, null, { enableBackdropDismiss: false });
    customInvoiceNewModal.present();

    // Refresh the list
    customInvoiceNewModal.onDidDismiss((data) => {
      if (data && data.refreshHorseDetail) {
        this.refreshList();
      }
    });
  }

  goToInvoiceDetail(invoice: Invoice) {
    const data = {
      id: invoice._id,
    };

    const invoiceDetailModal = this.modalCtrl.create(InvoiceDetailPage, data, { enableBackdropDismiss: false });
    invoiceDetailModal.present();
  }

  goToInvoiceExport() {
    const invoiceExportModal = this.modalCtrl.create(InvoiceExportPage, { enableBackdropDismiss: false });
    invoiceExportModal.present();
  }

  showPaymentAlert() {
    this.alertCtrl.create({
      title: 'First Add Payment Method',
      subTitle: 'You need to complete your payment information in your profile before you may proceed.',
      buttons: ['Okay'],
    }).present();
  }
}
