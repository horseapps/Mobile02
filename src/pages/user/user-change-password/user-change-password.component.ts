import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ViewController, ToastController } from 'ionic-angular';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/auth.service';
import { ValidationService } from '../../../components/control-errors/validation.service';

@Component({
  selector: 'page-change-password',
  templateUrl: 'user-change-password.html',
})

export class UserChangePasswordPage {
  form: FormGroup;
  submitAttempt: boolean = false;
  matchError: boolean;
  isSubmitting: boolean;

  constructor (
    public viewCtrl: ViewController,
    private formBuilder: FormBuilder,
    public authService: AuthService,
    private userService: UserService,
    private validationService: ValidationService,
    public toastCtrl: ToastController,
  ) {

    this.form = this.formBuilder.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    });
  }

  async submit() {
    this.submitAttempt = true;
    this.matchError = this.form.value.newPassword !== this.form.value.confirmPassword;

    if (this.form.valid && !this.matchError) {
      this.isSubmitting = true;

      try {
        await this.userService.changePassword(this.form.value);

        this.isSubmitting = false;

        const toast = this.toastCtrl.create({
          message: 'Your password has been updated!',
          duration: 3000,
          cssClass: 'toast-success',
        });

        toast.present();

        this.viewCtrl.dismiss();
      } catch (error) {
        this.validationService.buildServerErrors(this.form, error.json());
        const message = error.json().message || 'There was an error.';
        this.userService.handleError(message);
        this.isSubmitting = false;
      }
    }
  }
}
