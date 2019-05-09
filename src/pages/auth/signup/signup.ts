import { Component } from '@angular/core';
import { FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { ModalController, ViewController, ToastController, NavParams } from 'ionic-angular';

import { LoginPage } from '../login/login';
import { RolePage } from '../role/role';
import { ForgotPasswordPage } from '../forgot-password/forgot-password';

import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { ValidationService } from '../../../components/control-errors/validation.service';

@Component({
  selector: 'page-signup',
  templateUrl: 'signup.html',
})

export class SignupPage {
  form: FormGroup;
  errors: {} = {};
  loginData: any = {};

  constructor(
    private formBuilder: FormBuilder,
    private modalCtrl: ModalController,
    private viewCtrl: ViewController,
    private navParams: NavParams,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private userService: UserService,
    private validationService: ValidationService,
  ) {

    // If login data was sent - populate the form with username and password from login
    if (this.navParams.get('loginData')) {
      this.loginData = this.navParams.get('loginData');
    }

    this.form = this.formBuilder.group({
      email: [this.loginData.email || '', [Validators.required, this.validationService.emailValidator]],
      password: [this.loginData.password || '', [Validators.required, Validators.minLength(6)]],
    });
  }

  register(form: FormGroup) {
    if (form.valid) {
      this.userService.create({
        email: form.value.email,
        password: form.value.password,
      })
        .then((response) => {
          // Set auth token and current user from response
          this.authService.setToken(response.token);
          this.authService.currentUser = response;

          const roleModal = this.modalCtrl.create(RolePage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
          roleModal.present()
            .then(() => {
              this.viewCtrl.dismiss();
            });
        })
        .catch((err) => {
          this.validationService.buildServerErrors(form, err.json());
        });
    }
  }

  goToLogin() {
    const loginModal = this.modalCtrl.create(LoginPage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
    loginModal.present()
      .then(() => {
        this.viewCtrl.dismiss();
      });
  }
}
