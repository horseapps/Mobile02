import { Component, OnInit, ViewChild } from '@angular/core';
import { TextInput, Select } from 'ionic-angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { User } from '../../user/user';
import { Content, ViewController, ModalController, AlertController, ToastController, NavParams, Events, Platform } from 'ionic-angular';
import { RequestService } from '../request.service';
import { UserService } from '../../user/user.service';
import { SearchPage } from '../../../components/search/search.component';
import { RequestConfirmPage } from '../request-confirm/request-confirm.component';
import { Request } from '../request';
import { ConstantsService } from '../../../providers/constants.service';

@Component({
  selector: 'page-request-assign',
  templateUrl: 'request-assign.html',
})

export class RequestAssignPage implements OnInit {
  submitFunction: Function;
  form: FormGroup;
  isLoading: boolean;
  serviceProviderUntouched: boolean = true;
  request: Request;
  serviceProviderFunction: Function;
  submitAttempt: boolean;
  services: any = [];
  selectedServices: any = [];
  originalServicesLength: number;
  servicesError: boolean;
  currentAssignee: any;
  @ViewChild('content') content: Content;
  @ViewChild('providerNotes') providerNotes: TextInput;
  @ViewChild('serviceSelector') serviceSelector: Select;

  constructor(
    public formBuilder: FormBuilder,
    public requestService: RequestService,
    public userService: UserService,
    public viewCtrl: ViewController,
    public modalCtrl: ModalController,
    public toastCtrl: ToastController,
    public alertCtrl: AlertController,
    public navParams: NavParams,
    private events: Events,
    public constants: ConstantsService,
    private platform: Platform,
  ) {
    this.serviceProviderFunction = this.updateServiceProvider.bind(this);
    this.submitFunction = this.submit.bind(this);
  }

  /**
   * Get the request and update the available services
   */
  async ngOnInit() {
    try {
      this.isLoading = true;
      this.services = [];

      const id = this.navParams.get('id');
      this.request = await this.requestService.get(id);
      this.currentAssignee = this.request._reassignedTo || this.request._serviceProvider;

      this.services = this.request.services;
      this.originalServicesLength = this.services.length;

      this.form = this.formBuilder.group({
        _show: this.formBuilder.group({
          name: [''],
          _id: [''],
        }),
        competitionClass: [''],
        _serviceProvider: ['', Validators.compose([Validators.required])],
        services: this.formBuilder.array([]),
        instructions: [''],
        total: [''],
      });

      // Once the form is loaded, run update to attach form controls for existing services
      this.updateServices(this.services);
      this.isLoading = false;
    } catch (error) {
      const message = error.json().message || 'There was an error.';
      this.requestService.handleError(message);
      this.isLoading = false;
    }
  }

  /**
   * Update the value of _reassignedTo
   * @param {any} user The user object
   */
  updateServiceProvider(user: string) {
    this.serviceProviderUntouched = false;
    this.request._reassignedTo = user;
    this.currentAssignee = user;
  }

  /**
   * Update all services in form by clearing services and re-adding to form
   */
  updateServices(services: any, fromSelectExit: boolean = false) {
    // Clear form array
    this.form.controls.services = this.formBuilder.array([]);
    // Assemble currently selected service IDs for inclusion checking in a later step
    const selectedIds = this.services.map((service) => { return service._id; });
    // Add service controls to form and keep selected services list up to date
    const control = <FormArray>this.form.controls.services;
    services.forEach((service) => {
      if (!service.quantity) {
        service.quantity = 1;
      }
      control.push(
        this.formBuilder.group({
          service: [service.service, [Validators.required]],
          rate: [service.rate, [Validators.required]],
          quantity: [+service.quantity, [Validators.required]],
          _id: [service._id, [Validators.required]],
        }),
      );
      // Add the newly selected service to the page's service list if it isn't already selected
      if (!selectedIds.includes(service._id)) {
        service.quantity = 1;
        this.services.push(service);
      }
    });
    // If exiting a select view this update, remove de-selected services from the displayed list
    if (fromSelectExit) {
      const deselectedServices = this.currentAssignee.services.filter((svc) => { return !services.includes(svc); });
      const deselectedIds = deselectedServices.map((s) => { return s._id; });
      this.services.forEach((listedService, index) => {
        if (deselectedIds.includes(listedService._id)) {
          this.services.splice(index, 1);
        }
      });
    }
    // Patch value to update form value
    this.form.patchValue({
      services: services,
    });
  }

  /**
   * Returns true if the service is currently in the list of selected service items, false if not
   * @param {any} service The service to be checked against the selected list
   */
  inServiceList(service: any) {
    const selectedIds = this.services.map((selectedService) => { return selectedService._id; });
    return selectedIds.includes(service._id);
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
  setServiceQuantity(service: any, input: any) {
    const quantity = input.value || '';
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

  /**
   * Open the request confirmation modal
   */
  async goToConfirmation() {
    this.submitAttempt = true;
    // Copy the services as managed in this view into the existing request
    if (this.request) { this.request.services = this.services; }
    if (this.request && this.request.services.length >= 1 && this.request._reassignedTo) {

      // Add total for display on the confirmation page
      this.request.total = 0;
      this.request.services.forEach((service) => {
        this.request.total += (+service.rate * (+service.quantity || 1));
      });

      // Set requestService.request
      this.requestService.request = this.request;

      // Add provider notes
      if (this.providerNotes.value) {
        this.request.providerNotes = this.providerNotes.value;
      }

      const data =  {
        submitFunction: this.submitFunction,
      };

      const requestConfirmModal = this.modalCtrl.create(RequestConfirmPage, data, { enableBackdropDismiss: false });
      requestConfirmModal.present();
    }
  }

  /**
   * Update the request
   * @param {Request} request The request object
   */
  async submit(request: Request) {
    if (request) {
      try {
        // Remove tags from any services added this visit,
        // to differentiate from services added in future visits.
        request.services.forEach((service: any) => {
          service.addedThisVisit = false;
        });

        // Update the request
        const updatedRequest = await this.requestService.update(request);

        const toast = this.toastCtrl.create({
          message: 'This request has been updated!',
          duration: 3000,
          cssClass: 'toast-success',
        });
        toast.present();

        this.viewCtrl.dismiss()
          .then(() => {
            this.events.publish('request:created/updated');
          });
      } catch (error) {
        const message = error.json().message || 'There was an error.';
        this.requestService.handleError(message);
      }
    }
  }

  /**
   * Navigate to search modal
   * @param {Function} selectFunction  Function to use when selecting an item
   * @param {string}   placeholderText Placeholder text for searchbar
   */
  goToSearchModal(selectFunction: Function, placeholderText: string) {
    const params = {
      searchPlaceholder: placeholderText,
      serviceType: 'userService',
      selectFunction: selectFunction,
      role: 'service provider',
    };

    const searchModal = this.modalCtrl.create(SearchPage, params);
    searchModal.present();
  }

  /**
   * If form has been filled out, confirm user wants to go back
   */
  dismiss() {
    if ((this.request._reassignedTo && !this.serviceProviderUntouched) || (this.originalServicesLength !== this.services.length)) {
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

  /**
   * Check a single rate to see if it is greater than $1.00
   * @param {number} rate A service rate
   */
  validateRate(rate: number) {
    this.servicesError = false;
    if (rate && rate < 1) {
      this.servicesError = true;
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
      const objectIdFunc = (rnd = (r16) => Math.floor(r16).toString(16)) =>
        rnd(Date.now() / 1000) + ' '.repeat(16).replace(/./g, () => rnd(Math.random() * 16));
      const objectId = objectIdFunc();
      // Add a field to signal that the service is being added on by the user
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
      this.updateServices(this.services);
    } else {
      this.servicesError = true;
    }
    // Re-validate to generate errors for the new empty input and prevent saving blank services
    this.validateServices();
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

    // Remove the service from the ion-select's list of values so the states match
    this.serviceSelector.value.forEach((selection, selectIndex) => {
      if (selection._id === removedService._id) {
        this.serviceSelector.value.splice(selectIndex, 1);
      }
    });
    this.validateServices();
  }

  /**
   * Scroll to the service input section
   * If we do not manually scroll the keyboard will cover the input
   * @param index: number The list index of the focused-on service
   */
  scrollToServiceInput(index: number) {
    // Clear the page header and form fields when scrolling
    const pageHeaderClearance = 60;
    const formFieldsClearance = 200;
    // Set the height of each service card
    const serviceCardHeight = 66;
    if (this.platform.is('cordova')) {
      // Add to the scroll pixels based on which service is being edited
      let yOffset = pageHeaderClearance + formFieldsClearance + (serviceCardHeight * index);
      this.content.scrollTo(0, yOffset, 500);
    }
  }

  /**
   * Scroll to the provider notes input section
   * If we do not manually scroll the keyboard will cover the input
   */
  scrollToNotesInput() {
    // Clear the page header, form fields, and add service buttons when scrolling
    const pageHeaderClearance = 60;
    const formFieldsClearance = 200;
    const buttonsClearance = 150;
    // Set the height of each service card
    const serviceCardHeight = 66;
    if (this.platform.is('cordova')) {
      // Scroll to the provider notes input
      let yOffset = pageHeaderClearance + formFieldsClearance + buttonsClearance + (this.services.length * serviceCardHeight);
      this.content.scrollTo(0, yOffset, 500);
    }
  }
}
