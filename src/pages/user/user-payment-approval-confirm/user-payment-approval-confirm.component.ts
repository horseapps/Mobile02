import { Component, Input, OnInit } from '@angular/core';
import { ToastController, ViewController, NavController, NavParams, Events, ModalController, AlertController } from 'ionic-angular';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SearchPage } from '../../../components/search/search.component';

@Component({
  selector: 'page-user-payment-approval-confirm',
  templateUrl: 'user-payment-approval-confirm.html',
})

export class UserPaymentApprovalConfirmPage implements OnInit {
  form: FormGroup;
  isSubmitting: boolean = false;
  submitFunction: Function;

  constructor(
    public authService: AuthService,
    public constants: ConstantsService,
    public modalCtrl: ModalController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    public userService: UserService,
    private events: Events,
  ) {
    this.events.subscribe('approval:created/updated', () => {
      this.viewCtrl.dismiss();
    });
  }

  ngOnInit() {
    if (this.navParams.get('form')) {
      this.form = this.navParams.get('form');
    }

    this.submitFunction = this.navParams.get('submitFunction');
  }

  /**
   * Adds or updates a payment approval
   */
  submit() {
    if (
      (this.submitFunction) &&
      (this.form && this.form.valid)
    ) {
      this.isSubmitting = true;
      this.submitFunction(this.form.value);
    }
  }
}
