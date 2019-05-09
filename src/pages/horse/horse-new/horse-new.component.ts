import { Component, OnInit, ViewChild } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { Content, ViewController, AlertController, ToastController, Events } from 'ionic-angular';
import { Horse } from '../horse';
import { HorseListPage } from '../horse-list/horse-list.component';
import { HorseFormPage } from '../horse-form/horse-form.component';
import { HorseService } from '../horse.service';
import { NavController } from 'ionic-angular';
import { ValidationService } from '../../../components/control-errors/validation.service';

@Component({
  selector: 'page-horse-new',
  templateUrl: 'horse-new.html',
})

export class HorseNewPage implements OnInit {
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

  ngOnInit(): void {
    this.horseService.horse = new Horse();
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

  // See if the form is dirty or gender or owner has been changed
  formDirty() {
    return this.horseFormPage.form.dirty ||
    this.horseFormPage.gender ||
    this.horseFormPage.form.value._owners.length;
  }

  async submit(horse: Horse, form: FormGroup) {
    if (horse) {
      try {
        const newHorse = await this.horseService.create(horse);
        this.horseFormPage.isSubmitting = false;

        const toast = this.toastCtrl.create({
          message: 'Your horse has been created!',
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
