import { Component, OnInit, ViewChild } from '@angular/core';
import { ToastController, ViewController, Events, AlertController } from 'ionic-angular';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';
import { UserServiceProviderFormPage } from '../user-service-provider-form/user-service-provider-form.component';

@Component({
  selector: 'page-user-new-service-provider',
  templateUrl: 'user-new-service-provider.html',
})

export class UserNewServiceProviderPage implements OnInit {
  submitFunction: Function;
  @ViewChild(UserServiceProviderFormPage) userServiceProviderFormPage: UserServiceProviderFormPage;

  constructor (
    public userService: UserService,
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
    return this.userServiceProviderFormPage.form.dirty;
  }

  async submit(providerData: {}) {
    if (providerData) {
      try {
        const updatedGroupedProviders = await this.userService.addServiceProvider(providerData);
        this.userService.groupedServiceProviders = updatedGroupedProviders;
        this.userServiceProviderFormPage.isSubmitting = false;

        const toast = this.toastCtrl.create({
          message: 'Service Provider added!',
          duration: 3000,
          cssClass: 'toast-success',
        });
        toast.present();

        this.viewCtrl.dismiss()
          .then(() => {
            this.events.publish('provider:created');
          });
      } catch (error) {
        this.userServiceProviderFormPage.isSubmitting = false;
        const message = error.json().message || 'There was an error.';
        this.userService.handleError(message);
      }
    }
  }

}
