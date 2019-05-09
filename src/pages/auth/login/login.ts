import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ModalController, ViewController, Events, ToastController, AlertController } from 'ionic-angular';
import { SignupPage } from '../signup/signup';
import { RolePage } from '../role/role';
import { ForgotPasswordPage } from '../forgot-password/forgot-password';

import { AuthService } from '../auth.service';
import { ValidationService } from '../../../components/control-errors/validation.service';

@Component({
  selector: 'page-login',
  templateUrl: 'login.html',
})

export class LoginPage {
  form: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController,
    private viewCtrl: ViewController,
    private toastCtrl: ToastController,
    public alertCtrl: AlertController,
    private events: Events,
    private authService: AuthService,
    private validationService: ValidationService,
  ) {

    this.form = this.formBuilder.group({
      email: ['', [Validators.required, this.validationService.emailValidator]],
      password: ['', [Validators.required]],
    });

    this.events.subscribe('user:logged-in', () => { this.viewCtrl.dismiss(); });
  }

  login() {
    if (this.form.valid) {
      const email =  this.form.value.email;
      const password = this.form.value.password;
      this.authService.login(email, password)
        .then((response) => {
          this.form.reset();

          // Make sure user has finished account setup
          if (!this.authService.currentUser.accountSetupComplete) {
            const roleModal = this.modalCtrl.create(RolePage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
            roleModal.present()
              .then(() => {
                this.viewCtrl.dismiss();
              });
          }
        })
        .catch((err) => {
          // If email is not registered, let user navigate to sign up page from alert
          let message = err.json().message || 'There was an error.';
          if (err.json().message && err.json().message === 'This email is not registered.') {
            this.newUserAlert();
          } else {
            const toast = this.toastCtrl.create({
              message: message,
              duration: 3000,
              cssClass: 'toast-danger',
            });
            toast.present();
          }
        });
    }
  }

  newUserAlert() {
    let confirm = this.alertCtrl.create({
      title: 'Email Not Registered',
      message: 'This email is not registered yet. Would you like to create an account?',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            this.goToSignup();
          },
        },
      ],
    });

    confirm.present();
  }

  goToSignup() {
    const signUpModal = this.modalCtrl.create(
      SignupPage,
      { loginData: this.form.value },
      { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' },
    );

    signUpModal.present()
      .then(() => {
        this.viewCtrl.dismiss();
      });
  }

  goToForgotPassword() {
    const forgotPasswordModal = this.modalCtrl.create(
      ForgotPasswordPage,
      null,
      { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' },
    );

    forgotPasswordModal.present()
      .then(() => {
        this.viewCtrl.dismiss();
      });
  }
}
