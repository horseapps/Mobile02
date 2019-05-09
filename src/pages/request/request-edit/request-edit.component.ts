import { Component, OnInit, ViewChild } from '@angular/core';
import { ViewController, NavController, AlertController, ToastController, Events } from 'ionic-angular';
import { RequestService } from '../request.service';
import { Request } from '../request';
import { RequestFormPage } from '../request-form/request-form.component';

@Component({
  selector: 'page-request-edit',
  templateUrl: 'request-edit.html',
})

export class RequestEditPage implements OnInit {
  submitFunction: Function;
  @ViewChild(RequestFormPage) requestFormPage: RequestFormPage;

  constructor(
    public requestService: RequestService,
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public events: Events,
  ) { }

  ngOnInit() {
    // Bind 'this' since the submit function is a callback
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
    const showChanged = this.requestService.request._show &&
    this.requestFormPage.form.value._show._id !== this.requestService.request._show._id;

    return this.requestFormPage.form.dirty ||
    showChanged ||
    this.requestFormPage.selectedServices.length;
  }

  async submit(request: Request) {
    if (request) {
      if (!request._show.name) {
        delete request._show;
        delete request.competitionClass;
      }
      try {
        const updatedRequest = await this.requestService.update(request);

        this.requestFormPage.isSubmitting = false;

        const toast = this.toastCtrl.create({
          message: 'Your request has been updated!',
          duration: 3000,
          cssClass: 'toast-success',
        });
        toast.present();

        this.viewCtrl.dismiss({ refreshHorseDetail: true })
          .then(() => {
            this.events.publish('request:created/updated');
          });

      } catch (error) {
        this.requestFormPage.isSubmitting = false;
        const message = error.json().message || 'There was an error.';
        this.requestService.handleError(message);
      }
    }
  }
}
