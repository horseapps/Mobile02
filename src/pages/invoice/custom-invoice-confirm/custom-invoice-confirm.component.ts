import { Component, Input, OnInit } from '@angular/core';
import { ModalController, NavParams, ViewController, Events } from 'ionic-angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { User } from '../../user/user';
import { Request } from '../../request/request';
import { Show } from '../../show/show';
import { ShowService } from '../../show/show.service';
import { SearchPage } from '../../../components/search/search.component';
import { RequestService } from '../../request/request.service';
import { AuthService } from './../../auth/auth.service';
import { ConstantsService } from '../../../providers/constants.service';
import moment from 'moment';

interface Owner {
  _user: User;
  percentage: number;
}

@Component({
  selector: 'page-custom-invoice-confirm',
  templateUrl: 'custom-invoice-confirm.html',
})
export class CustomInvoiceConfirmPage implements OnInit {
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
  ) {}

  ngOnInit() {
    if (this.navParams.get('form')) {
      this.form = this.navParams.get('form');
    }

    this.submitFunction = this.navParams.get('submitFunction');
  }

  getServiceCount(services: any[]) {
    let serviceCount = 0;
    services.forEach((service) => {
      serviceCount += +service.quantity || 1;
    });
    return serviceCount;
  }

  /**
   * Updates or creates a request
   */
  submit(createInvoice: boolean = false) {
    if (
      (this.submitFunction) &&
      ((this.form && this.form.valid && this.form.value.services.length) ||
        (this.requestService.request.services.length && this.requestService.request._reassignedTo))
    ) {
      this.isSubmitting = true;
      try {
        this.submitFunction(this.requestService.request, createInvoice, this.viewCtrl);
      } catch (error) {
        this.isSubmitting = false;
        const message = error.json().message || 'There was an error.';
        this.requestService.handleError(message);
      }
    }
  }

  /**
   * Join all the owner names into one string
   * @param {Array} owners Array of Owner objects
   */
  joinOwnerNames(owners: Owner[]) {
    const ownerNames = owners.map((owner) => owner._user.name);
    return ownerNames.join(', ');
  }
}
