import { Component, Input, OnInit } from '@angular/core';
import { ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { User } from '../../user/user';
import { Request } from '../request';
import { Show } from '../../show/show';
import { ShowService } from '../../show/show.service';
import { SearchPage } from '../../../components/search/search.component';
import { RequestService } from '../request.service';
import { AuthService } from './../../auth/auth.service';
import { ConstantsService } from '../../../providers/constants.service';
import moment from 'moment';

@Component({
  selector: 'page-request-confirm',
  templateUrl: 'request-confirm.html',
})
export class RequestConfirmPage implements OnInit {
  form: FormGroup;
  isSubmitting: boolean = false;
  submitFunction: Function;

  constructor(
    public requestService: RequestService,
    public authService: AuthService,
    public constants: ConstantsService,
    public modalCtrl: ModalController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private events: Events,
   ) {
    // Dismiss view when request has been created
    this.events.subscribe('request:created/updated', () => {
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
   * Updates or creates a request
   */
  submit() {
    if (
      (this.submitFunction) &&
      ((this.form && this.form.valid && this.form.value.services.length) ||
      (this.requestService.request.services.length && this.requestService.request._reassignedTo))
    ) {
      this.isSubmitting = true;
      this.submitFunction(this.requestService.request);
    }
  }
}
