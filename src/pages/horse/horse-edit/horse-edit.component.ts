import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Content, ViewController, NavController, AlertController, Events, ToastController } from 'ionic-angular';
import { HorseService } from '../horse.service';
import { Horse } from '../horse';
import { HorseFormPage } from '../horse-form/horse-form.component';
import { ValidationService } from '../../../components/control-errors/validation.service';

@Component({
  selector: 'page-horse-edit',
  templateUrl: 'horse-edit.html',
})

export class HorseEditPage implements OnInit {
  @ViewChild('content') content: Content;
  submitFunction: Function;
  @ViewChild(HorseFormPage) horseFormPage: HorseFormPage;

  constructor(
    public horseService: HorseService,
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public events: Events,
    private validationService: ValidationService,
  ) { }

  ngOnInit() {
    // Bind 'this' since the submit function is a callback
    this.submitFunction = this.submit.bind(this);
  }

  /**
   * If form is dirty or a gender was picked, confirm that user wants to leave
   * before dismissing view
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

  // See if the form is dirty or gender or owner(s)/trainer has been changed
  formDirty() {
    return this.horseFormPage.form.dirty ||
    this.horseFormPage.gender !== this.horseService.horse.gender ||
    this.horseFormPage.form.value._trainer._id !== this.horseService.horse._trainer._id ||
    this.differentOwners();
  }

  /**
   * Check if the owners of a horse have changed
   */
  differentOwners() {
    let differentOwners = false;
    const originalOwnerIds = this.horseService.horse._owners.map((o) => String(o._user._id));
    this.horseFormPage.form.value._owners.forEach((owner) => {
      if (originalOwnerIds.indexOf(String(owner._user._id)) <= -1) {
        differentOwners = true;
      }
    });

    return differentOwners || this.horseService.horse._owners.length !== this.horseFormPage.form.value._owners.length;
  }

  async submit(horse: Horse, form: FormGroup) {
    if (horse) {
      try {
        const updatedHorse = await this.horseService.update(horse);
        this.horseFormPage.isSubmitting = false;

        const toast = this.toastCtrl.create({
          message: 'Your horse has been updated!',
          duration: 3000,
          cssClass: 'toast-success',
        });
        toast.present();

        this.events.publish('horse:refresh-list');

        this.navCtrl.pop();
      } catch (error) {
        this.horseFormPage.isSubmitting = false;
        this.validationService.buildServerErrors(form, error.json());
        const message = error.json().message || 'Please review for completeness.';
        this.horseService.handleError(message);
      }
    }
  }
}
