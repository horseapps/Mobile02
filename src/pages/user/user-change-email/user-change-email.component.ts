import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ViewController, ToastController } from 'ionic-angular';
import { UserService } from '../user.service';
import { AuthService } from '../../auth/auth.service';
import { ValidationService } from '../../../components/control-errors/validation.service';

@Component({
  selector: 'page-change-email',
  templateUrl: 'user-change-email.html',
})

export class UserChangeEmailPage {
  form: FormGroup;
  submitAttempt: boolean = false;
  isSubmitting: boolean;

  constructor (
    public viewCtrl: ViewController,
    private formBuilder: FormBuilder,
    public authService: AuthService,
    public userService: UserService,
    private validationService: ValidationService,
    public toastCtrl: ToastController,
  ) {

    this.form = this.formBuilder.group({
      email: [this.userService.user.email, [Validators.required, this.validationService.emailValidator]],
    });
  }

  async submit() {
    this.submitAttempt = true;

    if (this.form.valid) {
      this.isSubmitting = true;

      try {
        const updatedUser = await this.userService.updateMe(this.form.value);
        this.authService.currentUser = updatedUser;
        this.userService.user = updatedUser;
        this.isSubmitting = false;

        const toast = this.toastCtrl.create({
          message: 'Your email has been updated!',
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
