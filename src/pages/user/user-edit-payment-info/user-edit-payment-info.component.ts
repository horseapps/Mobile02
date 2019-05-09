import { Component, OnInit } from '@angular/core';
import { ToastController, ViewController, ModalController, AlertController } from 'ionic-angular';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';
import { UserNewPaymentApprovalPage } from '../user-new-payment-approval/user-new-payment-approval.component';
import { UserEditPaymentApprovalPage } from '../user-edit-payment-approval/user-edit-payment-approval.component';
import { UserProfilePage } from '../user-profile/user-profile.component';
import moment from 'moment';

@Component({
  selector: 'page-user-edit-payment-info',
  templateUrl: 'user-edit-payment-info.html',
})

export class UserEditPaymentInfoPage implements OnInit {
  submitFunction: Function;
  // paymentApprovals: Array<{}>;
  // ownerAuthorizations: Array<{}>;
  userProfilePage: any = UserProfilePage;
  isLoading: boolean;
  isRefreshing: boolean;
  constructor (
    public constants: ConstantsService,
    public authService: AuthService,
    public userService: UserService,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    private modalCtrl: ModalController,
    public viewCtrl: ViewController,
  ) {
    this.submitFunction = this.submit.bind(this);
  }

  ngOnInit(): void {
    this.preparePaymentApprovals();
    this.prepareOwnerAuthorizations();
  }

  // Update current user on auth service and user service and dismiss modal
  async submit() {
    try {
      const me = await this.authService.getCurrentUser();
      this.authService.currentUser = me;
      this.userService.user = me;

      const toast = this.toastCtrl.create({
        message: 'Your payment information has been updated!',
        duration: 3000,
        cssClass: 'toast-success',
      });

      toast.present();

      this.viewCtrl.dismiss();
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.userService.handleError(message);
    }
  }

  goToNewPaymentApprovalModal() {
    const newPaymentApprovalModal = this.modalCtrl.create(UserNewPaymentApprovalPage, null, { enableBackdropDismiss: false });
    newPaymentApprovalModal.present();
  }

  goToEditPaymentApprovalModal(approval: {}) {
    const editPaymentApprovalModal = this.modalCtrl.create(UserEditPaymentApprovalPage, approval, { enableBackdropDismiss: false });
    editPaymentApprovalModal.present();
  }

  async prepareOwnerAuthorizations() {
    try {
      await this.userService.getOwnerAuthorizations();
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.userService.handleError(message);
    }
  }

  async preparePaymentApprovals() {
    try {
      await this.userService.getPaymentApprovals();
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.userService.handleError(message);
    }
  }

  async deletePaymentApproval(approval: {_id: any}) {
    let confirm = this.alertCtrl.create({
      title: 'Really Delete?',
      message: 'Are you sure you want to delete this payment approver?',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            this.userService.deletePaymentApproval(approval._id)
              .then((response) => {
                let approvalsAfterDeletion = this.userService.paymentApprovals.filter((approvalObj: { _id: any }) => {
                  return !this.isDeletedIdMatch(response, approvalObj);
                });
                this.userService.paymentApprovals = approvalsAfterDeletion;
                this.successToast('The payment approver has been successfully deleted.');
              })
              .catch((error) => {
                const message = error.json().message || 'There was an error.';
                this.userService.handleError(message);
              });
          },
        },
      ],
    });

    confirm.present();
  }

  // Isolated the response into a function due to a void error from the UserService call
  isDeletedIdMatch(response: any, approval: {_id: any}) {
    return response.deletedId === approval._id;
  }

  displayAmountFor(approverData: {maxAmount: number, isUnlimited: boolean}) {
    let displayAmount;
    if (!approverData.isUnlimited) {
      displayAmount = `(Up to $${approverData.maxAmount.toString()})`;
    } else {
      displayAmount = '(No Limit)';
    }
    return displayAmount;
  }

  hasOwnerAuthorizations() {
    return this.userService.ownerAuthorizations && this.userService.ownerAuthorizations.length > 0;
  }

  hasPaymentApprovals() {
    return this.userService.paymentApprovals && this.userService.paymentApprovals.length > 0;
  }

  /**
   * Retrieves current user and refreshes their approvals/authorizations
   * @param refresher
   */
  async repopulateApprovalLists(refresher?: any) {
    try {
      this.isLoading = true;
      if (refresher) { this.isRefreshing = true; }
      const me = await this.authService.getCurrentUser();
      this.authService.currentUser = me;
      this.userService.user = me;
      this.preparePaymentApprovals();
      this.prepareOwnerAuthorizations();
      if (refresher) { refresher.complete(); }

      this.isRefreshing = false;
      this.isLoading = false;
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.userService.handleError(message);
      this.isRefreshing = false;
      this.isLoading = false;
    }
  }

  successToast(message: string) {
    const toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: 'toast-success',
    });

    toast.present();
  }
}
