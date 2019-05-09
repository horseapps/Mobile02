import { Component, Input, OnInit } from '@angular/core';
import { ToastController, ViewController, NavParams, Events, ModalController, AlertController } from 'ionic-angular';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';

@Component({
  selector: 'page-user-service-provider-confirm',
  templateUrl: 'user-service-provider-confirm.html',
})

export class UserServiceProviderConfirmPage implements OnInit {
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
    this.events.subscribe('provider:created', () => {
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
   * Adds a service provider
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
