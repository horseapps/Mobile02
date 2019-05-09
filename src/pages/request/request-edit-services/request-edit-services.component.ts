import { Component, OnInit, ViewChild } from '@angular/core';
import { ViewController, NavParams, AlertController, ToastController, Events, Content, Platform } from 'ionic-angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { RequestService } from '../request.service';
import { HorseService } from '../../horse/horse.service';
import { ConstantsService } from '../../../providers/constants.service';

import { Request } from '../request';

@Component({
  selector: 'page-request-edit-services',
  templateUrl: 'request-edit-services.html',
})

export class RequestEditServicesPage implements OnInit {
  form: FormGroup;
  isSubmitting: boolean;
  submitAttempt: boolean;
  isLoading: boolean;
  request: Request;
  originalServicesLength: number;
  services: any[];
  servicesError: boolean;
  @ViewChild('content') content: Content;

  constructor(
    public formBuilder: FormBuilder,
    public requestService: RequestService,
    public horseService: HorseService,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public events: Events,
    public constants: ConstantsService,
    private platform: Platform,
  ) {
  }

  async ngOnInit() {
    await this.findRequest();
    this.form = this.formBuilder.group({
      services: this.formBuilder.array([]),
      instructions: [''],
    });
    const control = <FormArray>this.form.controls.services;
    this.services.forEach((originalService: any) => {
      control.push(
        this.formBuilder.group({
          service: [originalService.service, [Validators.required]],
          rate: [originalService.rate, [Validators.required]],
          quantity: [originalService.quantity, [Validators.required]],
          _id: [originalService._id, [Validators.required]],
        }),
      );
    });
  }

  /**
   * Get the request and update services array
   */
  async findRequest() {
    try {
      this.isLoading = true;

      const id = this.navParams.get('id');
      this.request = await this.requestService.get(id);
      this.services = this.request.services;
      this.originalServicesLength = this.services.length;

      this.isLoading = false;
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.requestService.handleError(message);
      this.isLoading = false;
    }
  }

  /**
   * Add empty service to services array
   */
  addService() {
    // Only allow user to add a service if all other services are valid
    this.validateServices();
    if (!this.servicesError) {
      // Set a new mongoID for the custom service to tell it apart from others when updating form values
      const objectFunc = (rnd = (r16) => Math.floor(r16).toString(16)) =>
        rnd(Date.now() / 1000) + ' '.repeat(16).replace(/./g, () => rnd(Math.random() * 16));
      const objectId = objectFunc();
      const addedService = { service: '', rate: '', quantity: 1, _id: objectId, addedThisVisit: true, isCustom: true };
      this.services.push(addedService);

      const control = <FormArray>this.form.controls.services;
      control.push(
        this.formBuilder.group({
          service: [addedService.service, [Validators.required]],
          rate: [addedService.rate, [Validators.required]],
          quantity: [addedService.quantity, [Validators.required]],
          _id: [addedService._id, [Validators.required]],
        }),
      );
    } else {
      this.servicesError = true;
    }
    this.validateServices();
  }

  /**
   * Scroll to the service input section
   * If we do not manually scroll the keyboard will cover the input
   * @param index: number The list index of the focused-on service
   */
  scrollToServiceInput(index: number) {
    // Clear the page header when scrolling
    const pageHeaderClearance = 60;
    const serviceCardHeight = 66;
    if (this.platform.is('cordova')) {
      // Add to the scroll pixels based on which service is being edited
      let yOffset = pageHeaderClearance + (serviceCardHeight * index);
      this.content.scrollTo(0, yOffset, 500);
    }
  }

  /**
   * Remove service from services array
   * @param {number} i index of service in services array
   */
  removeService(i: number) {
    const removedService = this.services.splice(i, 1)[0];
    // Update the form control and remove service from form value
    const control = <FormArray>this.form.controls.services;
    this.form.controls.services.value.forEach((formService, index) => {
      if (removedService._id === formService._id) {
        control.removeAt(index);
        this.form.controls.services.value.splice(index, 1);
      }
    });
    this.validateServices();
  }

  /**
   * Make sure there are no services with an empty name, rate, or quantity
   */
  validateServices() {
    this.servicesError = false;
    this.services.forEach((service) => {
      const isWhole = this.wholeNumber(service.quantity);
      if (!service.service.length || service.rate < 1 || service.quantity < 1 || !isWhole) {
        this.servicesError = true;
      }
    });
  }

  // Returns true if a given number is a positive whole number, false if not
  wholeNumber(num: any) {
    if (num) {
      // Allow any number of digits greater than 0
      const match = String(num).match(/^\d*$/);
      if (match && num > 0) {
        return true;
      } else {
        return false;
      }
    } else {
      return false;
    }
  }

  /**
   * Clears the value of a given form input
   * @param input The form input to be cleared
   */
  clearValue(input: any) {
    input.value = '';
  }

  // Attaches newly set name on service card to the form's value
  setServiceName(service: any, event: any) {
    const name = event.value;
    const serviceId = service._id;
    this.form.controls.services.value.forEach((formService, index) => {
      if (serviceId === formService._id) {
        formService.service = name;
        this.services[index].service = name;
      }
    });
    this.validateServices();
  }

  // Attaches newly set name on service card to the form's value
  setServiceRate(service: any, event: any) {
    const rate = event.value;
    const serviceId = service._id;
    this.form.controls.services.value.forEach((formService, index) => {
      if (serviceId === formService._id) {
        formService.rate = +rate;
        this.services[index].rate = rate;
      }
    });
    this.validateServices();
  }

  // Attaches newly set quantity on service card to the form's value
  setServiceQuantity(service: any, event: any) {
    const quantity = event.value || '';
    const serviceId = service._id;
    // Unlike an added service's name and rate, the displayed value of the quantity
    // must be manually attached to the underlying service object
    this.form.controls.services.value.forEach((formService) => {
      if (serviceId === formService._id) {
        formService.quantity = quantity;
        this.services.forEach((listedService) => {
          if (serviceId === listedService._id) {
            listedService.quantity = quantity;
          }
        });
      }
    });
    this.validateServices();
  }

  async submit() {
    this.submitAttempt = true;
    this.validateServices();

    if (this.request && this.services.length > 0 && !this.servicesError) {
      try {
        /**
         * Remove tags from any services added this visit, to differentiate from services added in future visits.
         * Coerce the quantity into a number (came from a text input)
         */
        this.request.services = this.services;
        this.request.services.forEach((service: any) => {
          service.addedThisVisit = false;
          service.quantity = +service.quantity;
        });
        this.isSubmitting = true;

        const updatedRequest = await this.requestService.update(this.request);
        this.isSubmitting = false;

        const toast = this.toastCtrl.create({
          message: 'Your request has been updated!',
          duration: 3000,
          cssClass: 'toast-success',
        });
        toast.present();

        this.viewCtrl.dismiss()
          .then(() => {
            this.events.publish('request:created/updated');
          });

      } catch (error) {
        this.isSubmitting = false;
        const message = error.json().message || 'There was an error.';
        this.requestService.handleError(message);
      }
    } else {
      this.servicesError = true;
    }
  }

  /**
   * If services have been added/removed, confirm user wants to go back
   */
  dismiss() {
    if (this.originalServicesLength !== this.services.length) {
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
