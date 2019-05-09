import { Component, OnInit } from '@angular/core';
import { ViewController, ModalController, ToastController, AlertController, Events, NavParams, Platform } from 'ionic-angular';
import { Payment } from '../../payment/payment';
import { PaymentEditPage } from '../payment-edit/payment-edit.component';
import { UserPublicProfilePage } from '../../user/user-public-profile/user-public-profile.component';
import { HorsePublicProfilePage } from '../../horse/horse-public-profile/horse-public-profile.component';
import { Request } from '../../request/request';
import { User } from '../../user/user';
import { Horse } from '../../horse/horse';
import { PaymentService } from '../../payment/payment.service';
import { UserService } from '../../user/user.service';
import { AuthService } from '../../auth/auth.service';
import { HorseService } from '../../horse/horse.service';
import { InvoiceService } from '../invoice.service';
import { ConstantsService } from '../../../providers/constants.service';
import { UtilityService } from '../../../providers/utility.service';
import { InvoiceEditPage } from '../invoice-edit/invoice-edit.component';
import { NavController } from 'ionic-angular';
import _ from 'lodash';
import moment from 'moment';

interface PayingUser {
  _user: User;
  percentage: number;
}

interface PaymentResponse {
  message: string;
  payment: Payment;
}

@Component({
  selector: 'page-invoice-detail',
  templateUrl: 'invoice-detail.html',
})

export class InvoiceDetailPage implements OnInit {
  displayTotal: number;
  originalTotal: number;
  tipAmount: number;
  paymentRequested: boolean;
  approvalIncreaseRequested: boolean;
  isSubmitting: any = {};
  isRequestingApproval: boolean;
  isRequestingApprovalIncrease: boolean;
  isLoading: boolean;
  requestGroup: any;
  serviceProvider: User;
  horseManager: User;
  mainProviderTotal: number;

  constructor(
    public paymentService: PaymentService,
    public userService: UserService,
    public authService: AuthService,
    public horseService: HorseService,
    public invoiceService: InvoiceService,
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    public events: Events,
    public alertCtrl: AlertController,
    public constants: ConstantsService,
    public utilityService: UtilityService,
    private platform: Platform,
  ) {
    this.paymentService.setIdempotentKey('');
  }

  // Make sure we have the latest Stripe percentage fee before letting user pay
  ionViewWillEnter() {
    this.constants.setStripeFee();
  }

  ngOnInit() {
    this.findOne();
  }

  /**
   * Retrieves one invoice and sets to this.invoiceService.invoice
   */
  async findOne(refresher?: any) {
    this.isLoading = true;
    let invoiceId = this.navParams.get('id');

    try {
      this.invoiceService.invoice = await this.invoiceService.get(invoiceId);
      this.originalTotal = this.invoiceService.invoice.amount;
      if (this.invoiceService.invoice.tip > 0) {
        this.tipAmount = this.invoiceService.invoice.tip;
      }

      this.updateDisplayTotal();

      // Set the main service provider total
      if (this.isMainServiceProvider()) {
        this.mainProviderTotal = this.invoiceService.calculateTotalForMainProvider(this.invoiceService.invoice._requests);
      }

      // Set the isSubmitting object
      this.invoiceService.invoice._payingUsers.forEach((payingUser) => {
        this.isSubmitting[payingUser._user._id] = false;
      });

      this.isLoading = false;

      if (refresher) {
        refresher.complete();
      }
    } catch (error) {
      this.isLoading = false;
      const message = error.json().message || 'There was an error.';
      this.utilityService.errorToast(message);
    }
  }

  /**
   * Submit payment
   * @param {PayingUser} payer The paying user object
   */
  submit(payer: PayingUser) {
    // Build up the payment object
    const payment = new Payment();
    payment.uuid = this.paymentService.getIdempotentKey();
    payment._invoice = this.invoiceService.invoice._id;
    payment.percentOfInvoice = payer.percentage;
    payment.invoiceTotal = this.invoiceService.invoice.amount;
    payment.tip = this.tipAmount;
    payment._payingUser = payer._user._id;
    payment._serviceProvider = this.invoiceService.invoice._serviceProvider;
    payment._requests = this.invoiceService.invoice._requests.map((request) => request._id);

    let confirm = this.alertCtrl.create({
      title: 'Submit Payment?',
      message: 'Are you sure you want to submit payment for this invoice?',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            this.isSubmitting[payer._user._id] = true;

            this.paymentService.create(payment)
              .then((response) => {
                this.isSubmitting[payer._user._id] = false;
                this.invoiceService.invoice._payments.push(response.payment);
                let message = response.message || 'Payment submitted';

                // If invoice payments are the same number as paying users, invoice is paid in full
                // Remove a paid invoice from the outstanding list
                // Otherwise, update the ui with the paid at date
                if (this.invoiceService.invoice._payingUsers.length === this.invoiceService.invoice._payments.length) {
                  this.invoiceService.removeInvoice(response.payment._invoice);
                  this.viewCtrl.dismiss();
                } else {
                  this.events.publish('invoice:created/updated');
                }

                this.paymentService.setIdempotentKey('');
                this.utilityService.successToast(message);
              })
              .catch((error) => {
                this.isSubmitting[payer._user._id] = false;
                const message = error.json().message || 'There was an error.';
                this.utilityService.errorToast(message);
                this.paymentService.setIdempotentKey(message);
              });
          },
        },
      ],
    });

    confirm.present();
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

  /**
   * Check if currentUser is the main service provider on the invoice
   */
  isMainServiceProvider() {
    const serviceProviderId = this.invoiceService.invoice._serviceProvider._id;
    return this.authService.currentUser._id === serviceProviderId;
  }

  /**
   * Update the total (inflated for the horse manager) + tip
   */
  updateDisplayTotal() {
    this.displayTotal = (this.constants.addServiceFee(+this.originalTotal)) + (+this.tipAmount || 0);
  }

  /**
   * Calculate the % the paying user owes based on ownership percentage
   * @param {PayingUser} payingUser The paying user object
   */
  calculatePayerTotal(payingUser: PayingUser) {
    const percentageOfTotal = (payingUser.percentage / 100) * this.originalTotal;
    const percentageOfTip = (payingUser.percentage / 100) * this.tipAmount || 0;
    return this.constants.addServiceFee(percentageOfTotal) + percentageOfTip;
  }

  /**
   * Check if current user is the given paying user
   * @param {String} payerId The paying user id
   */
  isPayingUser(payerId: string) {
    return this.authService.currentUser && this.authService.currentUser._id === payerId;
  }

  /**
   * Check if current user is a payment approver for the given payer
   * @param {String} payerId The paying user id
   */
  isPaymentApprover(payerId: string) {
    // Find paymentApproval where the _payer is the given payer, and _approver is the current user
    const matchedPaymentApprovers = this.invoiceService.invoice.paymentApprovals.filter((paymentApproval) => {
      return paymentApproval._payer === payerId &&
      paymentApproval._approver._id === this.authService.currentUser._id;
    });

    return matchedPaymentApprovers.length > 0;
  }

  /**
   * Check if current user is a payment approver for the given payer and their max amount
   * is enough to cover their portion of the invoice
   * @param {Object} payer The paying user object
   */
  isApprovedForTotal(payer: PayingUser) {
    // Find paymentApproval where the _payer is the given payer, and _approver is the current user
    const matchedPaymentApprovers = this.invoiceService.invoice.paymentApprovals.filter((paymentApproval) => {
      return paymentApproval._payer === payer._user._id &&
      paymentApproval._approver._id === this.authService.currentUser._id;
    });

    // Check if the payment approver has enough money to cover their portion of the invoice
    if (matchedPaymentApprovers.length) {
      return matchedPaymentApprovers[0].isUnlimited ||
        this.calculatePayerTotal(payer) <= matchedPaymentApprovers[0].maxAmount;
    } else {
      return false;
    }
  }

  /**
   * Find the payment approver and return the max amount for the given paying user
   * @param {PayingUser} payer The paying user object
   */
  approvalAmount(payer: PayingUser) {
    // Find paymentApproval where the _payer is the given payer, and _approver is the current user
    const index = this.invoiceService.invoice.paymentApprovals.findIndex((paymentApproval) => {
      return paymentApproval._payer === payer._user._id &&
        paymentApproval._approver._id === this.authService.currentUser._id;
    });

    if (index > -1) {
      return this.invoiceService.invoice.paymentApprovals[index].maxAmount;
    }
  }

  /**
   * Hit API endpoint that sends email to paying user reminding them to submit payment
   * @param {Object} payer The paying user object
   */
  async requestApprovalIncrease(payer: PayingUser) {
    const approvalInformation = {
      invoiceId: this.invoiceService.invoice._id,
      amountOwed: this.calculatePayerTotal(payer),
      ownerId: payer._user._id,
    };

    try {
      this.isRequestingApprovalIncrease = true;
      await this.invoiceService.requestApprovalIncrease(approvalInformation);
      this.approvalIncreaseRequested = true;
      this.isRequestingApprovalIncrease = false;
      this.utilityService.successToast('The horse owner has been notified of your request.');
    } catch (error) {
      this.isRequestingApprovalIncrease = false;
      const message = error.json().message || 'There was an error.';
      this.utilityService.errorToast(message);
    }
  }

  /**
   * Hit API endpoint that sends email to paying user reminding them to submit payment
   * @param {Object} payer The paying user object
   */
  async requestApproval(payer: PayingUser) {
    const approvalInformation = {
      invoiceId: this.invoiceService.invoice._id,
      amountOwed: this.calculatePayerTotal(payer),
      ownerId: payer._user._id,
    };

    try {
      this.isRequestingApproval = true;
      await this.invoiceService.requestApproval(approvalInformation);
      this.paymentRequested = true;
      this.isRequestingApproval = false;
      this.utilityService.successToast('The horse owner has been notified of your request.');
    } catch (error) {
      this.isRequestingApproval = false;
      const message = error.json().message || 'There was an error.';
      this.utilityService.errorToast(message);
    }
  }

  /**
   * Check if there is a payment for the given payer attached to the invoice
   * @param {PayingUser} payer The PayingUser object
   */
  paymentIndex(payer: PayingUser) {
    const index = this.invoiceService.invoice._payments.findIndex((o) => {
      let payingUserId;
      if (o._payingUser._id) {
        payingUserId = o._payingUser._id;
      } else {
        payingUserId = o._payingUser;
      }

      return payingUserId === payer._user._id;
    });

    return index;
  }

  /**
   * Return payment createdAt date formatted by moment
   * @param {number} index Index of payment in invoiceService.invoice._payments
   */
  paymentCreatedOn(index: number) {
    if (index >= 0) {
      const createdAt = this.invoiceService.invoice._payments[index].createdAt;
      return moment(createdAt).format('MM/DD/YYYY');
    }
  }

  /**
   * Go to edit invoice view
   */
  goToEditPage() {
    const data = {
      requests: this.invoiceService.invoice._requests,
      invoice: this.invoiceService.invoice,
      detailViewCtrl: this.viewCtrl,
    };

    const invoiceEditModal = this.modalCtrl.create(InvoiceEditPage, data, { enableBackdropDismiss: false });
    invoiceEditModal.present();
  }

  /**
   * Mark an invoice as paid outside the app
   */
  markAsPaid() {
    let confirm = this.alertCtrl.create({
      title: 'Mark Invoice As Paid?',
      message: `This means you have received payment outside the app and the horse owner(s) will no longer` +
      ` be able to submit payment through the app.`,
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            // Mark invoice as paid via API and create a new payment object
            const requestObj = {
              requests: this.invoiceService.invoice._requests,
              invoice: this.invoiceService.invoice._id,
            };

            this.paymentService.markAsPaid(requestObj)
              .then((response) => {

                // Remove invoice from outstanding list of invoices
                this.utilityService.successToast('Your invoice has been marked as paid.');
                this.invoiceService.removeInvoice(this.invoiceService.invoice._id);
                this.viewCtrl.dismiss();
              })
              .catch((error) => {
                const message = error.json().message || 'There was an error.';
                this.paymentService.handleError(message);
              });
          },
        },
      ],
    });

    confirm.present();
  }

  /**
   * Hit API endpoint that sends email to paying users reminding them to submit payment
   */
  requestPayment() {
    let confirm = this.alertCtrl.create({
      title: 'Request Payment?',
      message: `Are you sure you want to request payment for these services?` +
      ` A notification will be sent to the horse trainer(s).`,
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            // Send email/push reminder to paying users to pay the invoice
            this.invoiceService.requestPayment(this.invoiceService.invoice)
              .then((response) => {
                // Update variable to update button style
                this.paymentRequested = true;
                this.utilityService.successToast('Payment has been requested.');
              })
              .catch((error) => {
                const message = error.json().message || 'There was an error.';
                this.paymentService.handleError(message);
              });
          },
        },
      ],
    });

    confirm.present();
  }

  /**
   * Get the amount currently paid on an invoice
   */
  amountPaidOnInvoice() {
    let total = 0;
    this.invoiceService.invoice._payments.forEach((payment) => {
      total += (payment.amount + (payment.tip || 0));
    });

    return total;
  }

  /**
   * Get the remaining balance on the invoice
   */
  outstandingBalance() {
    const amountPaid = this.amountPaidOnInvoice();
    const invoiceTotal = this.invoiceService.invoice.amount;
    const tip = this.invoiceService.invoice.tip || 0;
    return (invoiceTotal + tip) - amountPaid;
  }

  /**
   * Only main service providers can see the balance for an unpaid invoice with
   * no payments against it
   */
  shouldShowBalance() {
    return this.authService.isServiceProvider() &&
      this.isMainServiceProvider() &&
      !this.invoiceService.invoice.paidInFullAt &&
      this.invoiceService.invoice._payments.length;
  }
}
