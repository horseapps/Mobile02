import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastController, ViewController, NavController, Events, AlertController } from 'ionic-angular';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';
import { UserPaymentApprovalFormPage } from '../user-payment-approval-form/user-payment-approval-form.component';

@Component({
  selector: 'page-user-new-payment-approval',
  templateUrl: 'user-new-payment-approval.html',
})

export class UserNewPaymentApprovalPage implements OnInit {
  submitFunction: Function;
  @ViewChild(UserPaymentApprovalFormPage) userPaymentApprovalFormPage: UserPaymentApprovalFormPage;

  constructor (
    public userService: UserService,
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public events: Events,
  ) { }

  ngOnInit(): void {
    this.submitFunction = this.submit.bind(this);
  }

  /**
   * If form is dirty, confirm that user wants to leave before dismissing view
   */
  dismiss() {
    if (this.formDirty()) {
      let confirm = this.alertCtrl.create({
        title: 'Go Back?',
        message: 'Are you sure you want to go back? All your changes will be lost.',
        buttons: [
          { text: 'Cancel' },
          {
            text: 'OK',
            handler: () => {
              this.viewCtrl.dismiss();
            },
          },
        ],
      });

      confirm.present();
    } else {
      this.viewCtrl.dismiss();
    }
  }

  // See if the form is dirty
  formDirty() {
    return this.userPaymentApprovalFormPage.form.dirty;
  }

  async submit(approvalData: {}) {
    if (approvalData) {
      try {
        const newApproval = await this.userService.addPaymentApproval(approvalData);
        this.applyNewApproval(newApproval);
        this.userPaymentApprovalFormPage.isSubmitting = false;

        const toast = this.toastCtrl.create({
          message: 'Payment Approver added!',
          duration: 3000,
          cssClass: 'toast-success',
        });
        toast.present();

        this.viewCtrl.dismiss()
          .then(() => {
            this.events.publish('approval:created/updated');
          });

      } catch (error) {
        this.userPaymentApprovalFormPage.isSubmitting = false;
        const message = error.json().message || 'There was an error.';
        this.userService.handleError(message);
      }
    }
  }

  applyNewApproval(newApproval: { _approver: any }) {
    let existingApprovalReplaced = false;
    this.userService.paymentApprovals.forEach((approval: { _approver: any }, index) => {
      if (approval._approver._id.toString() === newApproval._approver._id.toString()) {
        this.userService.paymentApprovals[index] = newApproval;
        existingApprovalReplaced = true;
      }
    });
    if (!existingApprovalReplaced) {
      this.userService.paymentApprovals.push(newApproval);
    }
  }
}
