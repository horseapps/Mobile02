import { Component, OnInit, ViewChild } from '@angular/core';
import { ViewController, AlertController, ToastController, Events } from 'ionic-angular';
import { Request } from '../request';
import { RequestListPage } from '../request-list/request-list.component';
import { RequestFormPage } from '../request-form/request-form.component';
import { RequestService } from '../request.service';
import { NavController } from 'ionic-angular';

@Component({
  selector: 'page-request-new',
  templateUrl: 'request-new.html',
})

export class RequestNewPage implements OnInit {
  submitFunction: Function;
  @ViewChild(RequestFormPage) requestFormPage: RequestFormPage;

  constructor(
    public requestService: RequestService,
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public events: Events,
  ) {}

  ngOnInit(): void {
    this.requestService.request = new Request();
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
    return this.requestFormPage.form.dirty ||
    this.requestFormPage.selectedServices.length ||
    this.requestFormPage.form.value._show;
  }

  async submit(request: Request) {
    if (request) {
      if (!request._show.name) {
        delete request._show;
        delete request.competitionClass;
      }
      try {
        const newRequest = await this.requestService.create(request);
        this.requestFormPage.isSubmitting = false;

        const toast = this.toastCtrl.create({
          message: 'Your request has been created!',
          duration: 3000,
          cssClass: 'toast-success',
        });
        toast.present();

        this.viewCtrl.dismiss({ refreshHorseDetail: true })
          .then(() => {
            this.events.publish('request:created/updated');
            this.events.publish('horse:refresh-list');
          });

      } catch (error) {
        this.requestFormPage.isSubmitting = false;
        const message = error.json().message || 'There was an error.';
        this.requestService.handleError(message);
      }
    }
  }
}
