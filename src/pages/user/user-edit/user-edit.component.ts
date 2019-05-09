import { Component, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Content, ToastController, ModalController, AlertController, ViewController, Events, Platform } from 'ionic-angular';
import { UserChangePasswordPage } from '../user-change-password/user-change-password.component';
import { UserChangeEmailPage } from '../user-change-email/user-change-email.component';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';
import { ValidationService } from '../../../components/control-errors/validation.service';

@Component({
  selector: 'page-user-edit',
  templateUrl: 'user-edit.html',
})

export class UserEditPage {
  form: FormGroup;
  isSubmitting: boolean;
  submitAttempt: boolean = false;
  phoneMask: any;
  @ViewChild('content') content: Content;

  constructor (
    private formBuilder: FormBuilder,
    private viewCtrl: ViewController,
    private alertCtrl: AlertController,
    private modalCtrl: ModalController,
    public authService: AuthService,
    public userService: UserService,
    public constants: ConstantsService,
    private validationService: ValidationService,
    public events: Events,
    public toastCtrl: ToastController,
    private platform: Platform,
  ) {
    this.phoneMask = [/[1-9]/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, '-', /\d/, /\d/, /\d/, /\d/];

    if (this.authService.isManager()) {
      this.form = this.formBuilder.group({
        name: [this.userService.user.name, [Validators.required]],
        phone: [this.userService.user.phone, [Validators.required]],
        barn: [this.userService.user.barn || ''],
        location: [this.userService.user.location || ''],
        avatar: [this.userService.user.avatar || ''],
      });
    }

    if (this.authService.isServiceProvider()) {
      this.form = this.formBuilder.group({
        name: [this.userService.user.name, [Validators.required]],
        phone: [this.userService.user.phone, [Validators.required]],
        avatar: [this.userService.user.avatar || ''],
        services: this.formBuilder.array([]),
      });

      this.populateServices();
    }
  }

  /**
   * Scroll to the service input section
   * If we do not manually scroll the keyboard will cover the input
   */
  scrollToServiceInput() {
    if (this.platform.is('cordova')) {
      // Scroll to the first service input
      const id = 'services-section';
      let yOffset = document.getElementById(id).offsetTop;
      this.content.scrollTo(0, yOffset, 1000);
    }
  }

  /**
   *  Populate form with user's services
   */
  populateServices() {
    const control = <FormArray>this.form.controls.services;

    // Add service controls to form
    this.userService.user.services.forEach((service) => {
      control.push(
        this.formBuilder.group({
          service: [service.service, [Validators.required]],
          rate: [service.rate, [this.validationService.minimumServiceAmount]],
          _id: [service._id, [Validators.required]],
        }),
      );
    });
  }

  /**
   * Initialize services array with a blank service
   */
  initService() {
    // initialize our services
    return this.formBuilder.group({
      service: ['', [Validators.required]],
      rate: ['', [this.validationService.minimumServiceAmount]],
    });
  }

  /**
   * Add service to form array group
   */
  addService() {
    // Add service to the list if previous services are valid
    if (this.form.controls.services.valid) {
      const control = <FormArray>this.form.controls.services;
      control.push(this.initService());
    }
  }

  /**
   * Remove service from form array group
   * @param {number} i index of service in form array
   */
  removeService(i: number) {
    // Remove service from the list
    const control = <FormArray>this.form.controls.services;
    control.removeAt(i);
  }

  async submit() {
    this.submitAttempt = true;

    // There is an open issue with text-mask module https://github.com/text-mask/text-mask/issues/294
    // Sometimes an extra character is being added that we need to trim
    if (this.form.value.phone && this.form.value.phone.length > 12) {
      this.form.value.phone = this.form.value.phone.slice(0, 12);
    }

    // Add avatar if there is one
    if (this.authService.currentUser.avatar) {
      this.form.value.avatar = this.authService.currentUser.avatar;
    }

    if (this.form.valid) {
      this.isSubmitting = true;

      try {
        // Update the current user
        const updatedUser = await this.userService.updateMe(this.form.value);
        this.authService.currentUser = updatedUser;
        this.userService.user = updatedUser;
        this.isSubmitting = false;

        this.successToast();
        this.viewCtrl.dismiss();

      } catch (error) {
        this.isSubmitting = false;
        this.validationService.buildServerErrors(this.form, error.json());
      }
    }
  }

  /**
   * Create a success message
   */
  successToast() {
    const toast = this.toastCtrl.create({
      message: 'Your profile has been updated!',
      duration: 3000,
      cssClass: 'toast-success',
    });

    toast.present();
  }

  openChangeEmail() {
    const changeEmailModal = this.modalCtrl.create(UserChangeEmailPage, null, { enableBackdropDismiss: false });
    changeEmailModal.present();
  }

  openChangePassword() {
    const changePasswordModal = this.modalCtrl.create(UserChangePasswordPage, null, { enableBackdropDismiss: false });
    changePasswordModal.present();
  }

  /**
   * If form has been filled out, confirm user wants to go back
   */
  dismiss() {
    if (this.form.dirty ||
      (this.form.value.services && (this.form.value.services.length !== this.authService.currentUser.services.length))
    ) {
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
}
