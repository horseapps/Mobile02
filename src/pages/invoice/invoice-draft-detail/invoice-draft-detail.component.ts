import { Component, OnInit } from '@angular/core';
import { ViewController, NavParams, ToastController, AlertController, Events, ModalController } from 'ionic-angular';
import { UserService } from '../../user/user.service';
import { AuthService } from '../../auth/auth.service';
import { HorseService } from '../../horse/horse.service';
import { InvoiceService } from '../invoice.service';
import { Request } from '../../request/request';
import { User } from '../../user/user';
import { Horse } from '../../horse/horse';
import { Invoice } from '../../invoice/invoice';
import { InvoiceEditPage } from '../invoice-edit/invoice-edit.component';
import { UserPublicProfilePage } from '../../user/user-public-profile/user-public-profile.component';
import { HorsePublicProfilePage } from '../../horse/horse-public-profile/horse-public-profile.component';
import { UtilityService } from '../../../providers/utility.service';

@Component({
  selector: 'page-invoice-draft-detail',
  templateUrl: 'invoice-draft-detail.html',
})

export class InvoiceDraftDetailPage implements OnInit {
  requestGroup: any[];
  submissionRequested: boolean = false;
  isSubmitting: boolean;
  mainProviderTotal: number;

  constructor(
    public userService: UserService,
    public authService: AuthService,
    public horseService: HorseService,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public toastCtrl: ToastController,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public utilityService: UtilityService,
    public invoiceService: InvoiceService,
    public events: Events,
  ) {}

  ngOnInit() {
    this.requestGroup = this.navParams.get('requestGroup');
    this.mainProviderTotal = this.invoiceService.calculateTotalForMainProvider(this.requestGroup[1]);
  }

  /**
   * Check if currentUser is the main service provider on group of requests
   * Requests are grouped by service provider, so each request will have the same main service provider
   */
  isMainServiceProvider() {
    const serviceProviderId = this.requestGroup[1][0]._serviceProvider._id;
    return this.authService.currentUser._id === serviceProviderId;
  }

  /**
   * Check if any of the requests has a reassignee
   */
  hasReassignees() {
    let hasReassignees = false;
    this.requestGroup[1].forEach((request) => {
      if (request._reassignedTo) {
        hasReassignees = true;
      }
    });

    return hasReassignees;
  }

  /**
   * Hit API endpoint that sends push/email notification to main service provider
   * to submit their drafted invoices
   */
  async requestSubmission() {
    try {
      await this.invoiceService.requestSubmission(this.requestGroup[1]);
      this.submissionRequested = true;
      this.utilityService.successToast('A request for invoice submission has been sent');
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.utilityService.errorToast(message);
    }
  }

  submitInvoice() {
    let confirm = this.alertCtrl.create({
      title: 'Submit Invoice?',
      message: 'Are you sure you want to submit this invoice for payment?',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            this.isSubmitting = true;

            let invoice = new Invoice();
            invoice._horse = this.requestGroup[1][0]._horse;
            invoice._requests = this.requestGroup[1];

            // Create the invoice
            this.invoiceService.create(invoice)
              .then((response) => {
                this.isSubmitting = false;
                this.events.publish('invoice:created/updated');
                this.utilityService.successToast('Invoice submitted');
                this.viewCtrl.dismiss();
              })
              .catch((error) => {
                this.isSubmitting = false;
                const message = error.json().message || 'There was an error.';
                this.utilityService.errorToast(message);
              });
          },
        },
      ],
    });

    confirm.present();
  }

  /**
   * Go to edit invoice view
   */
  goToEditPage() {
    const data = {
      requests: this.requestGroup[1],
      detailViewCtrl: this.viewCtrl,
    };

    const invoiceEditModal = this.modalCtrl.create(InvoiceEditPage, data, { enableBackdropDismiss: false });
    invoiceEditModal.present();
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
  goToPublicHorseProfile(horse: Horse) {
    const data = {
      horseId: horse._id,
    };

    const publicHorseProfileModal = this.modalCtrl.create(HorsePublicProfilePage, data, { enableBackdropDismiss: false });
    publicHorseProfileModal.present();
  }
}
