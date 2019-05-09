import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalController, ViewController, ToastController } from 'ionic-angular';

import { OnboardingPage } from '../onboarding/onboarding';
import { LoginPage } from '../login/login';

import { AuthService } from '../auth.service';
import { ValidationService } from '../../../components/control-errors/validation.service';

@Component({
  selector: 'page-forgot-password',
  templateUrl: 'forgot-password.html',
})

export class ForgotPasswordPage implements OnInit {
  form: FormGroup;
  constructor(
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController,
    private viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private validationService: ValidationService,
  ) { }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      email: ['', [Validators.required, this.validationService.emailValidator]],
    });
  }

  forgotPassword(form: FormGroup): void {
    if (form.valid) {
      this.authService.resetPassword(form.value.email)
        .then((response) => {
          const toast = this.toastCtrl.create({
            message: response.message,
            duration: 3000,
            cssClass: 'toast-success',
          });
          toast.present();

          form.reset();
        })
        .catch((response) => {
          const errors = response.json();

          if (errors.message) {
            const toast = this.toastCtrl.create({
              message: errors.message,
              duration: 3000,
              cssClass: 'toast-danger',
            });
            toast.present();
          } else {
            this.validationService.buildServerErrors(form, errors);
          }
        });
    }
  }

  goToLogin(): void {
    const loginModal = this.modalCtrl.create(LoginPage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
    loginModal.present()
      .then(() => {
        this.viewCtrl.dismiss();
      });
  }
}
