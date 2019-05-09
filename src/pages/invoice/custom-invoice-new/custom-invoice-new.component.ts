import { NavParams, Content, Platform, Select } from 'ionic-angular';
import { NavController, ModalController, ViewController, AlertController, ToastController } from 'ionic-angular';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { User } from '../../user/user';
import { Horse } from '../../horse/horse';
import { Invoice } from '../../invoice/invoice';
import { Request } from '../../request/request';
import { Show } from '../../show/show';
import { ShowService } from '../../show/show.service';
import { SearchPage } from '../../../components/search/search.component';
import { CalendarPage } from '../../../components/calendar/calendar.component';
import { CustomInvoiceConfirmPage } from '../custom-invoice-confirm/custom-invoice-confirm.component';
import { RequestService } from '../../request/request.service';
import { InvoiceService } from '../../invoice/invoice.service';
import { UserService } from './../../user/user.service';
import { AuthService } from './../../auth/auth.service';
import { HorseService } from './../../horse/horse.service';
import { ConstantsService } from '../../../providers/constants.service';
import { ValidationService } from '../../../components/control-errors/validation.service';
import moment from 'moment';

@Component({
  selector: 'page-custom-invoice-new',
  templateUrl: 'custom-invoice-new.html',
})

export class CustomInvoiceNewPage implements OnInit {
  searchPage: any = SearchPage;
  calendarPage: any = CalendarPage;
  customInvoiceConfirmPage: any = CustomInvoiceConfirmPage;
  form: FormGroup;
  submitAttempt: boolean = false;
  isSubmitting: boolean = false;
  showSearchTerm: string = '';
  searchText: string;
  shows: any[] = [];
  @Input() request: Request;
  serviceProviderFunction: Function;
  horseFunction: Function;
  dateFunction: Function;
  minYear: any = moment().startOf('year').format();
  maxYear: any = moment(this.minYear).add(2, 'years').endOf('year').format();
  services: any = [];
  selectedServices: any = [];
  originalServices: any = [];
  horse: Horse;
  horses: [Horse];
  updatingServiceProvider: boolean;
  updatingHorse: boolean;
  newProviderSelected: boolean;
  newHorseSelected: boolean;
  date: any;
  noServicesSelected: boolean;
  servicesError: boolean;
  @ViewChild('content') content: Content;
  @ViewChild('serviceSelector') serviceSelector: Select;
  submitFunction: Function;

  constructor(
    public requestService: RequestService,
    public invoiceService: InvoiceService,
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public formBuilder: FormBuilder,
    public constants: ConstantsService,
    public validationService: ValidationService,
    public authService: AuthService,
    public userService: UserService,
    public horseService: HorseService,
    public showService: ShowService,
    public modalCtrl: ModalController,
    public navParams: NavParams,
    private platform: Platform,
  ) {
    this.horse = this.navParams.get('horse');
    this.updatingHorse = this.navParams.get('updatingHorse');
    // Set request date to noon (time is never displayed, only date)
    this.date = moment().set({ 'hour': 12, 'minute': 0, 'second': 0 }).format('MM/DD/YYYY');
  }

  ngOnInit(): void {
    this.requestService.request = new Request();
    this.requestService.request.services = [];
    this.form = this.formBuilder.group({
      _show: this.formBuilder.group({
        name: [''],
        _id: [''],
      }),
      date: [this.date.toLocaleString().split(',')[0], Validators.compose([Validators.required])],
      fromCustomInvoice: true,
      competitionClass: [''],
      _serviceProvider: [this.authService.currentUser],
      services: this.formBuilder.array([]),
      instructions: [''],
      _horse: [this.horse, Validators.compose([Validators.required])],
      total: [''],
    });
    // Add provider's existing service list to form's service select options
    if (this.form.controls._serviceProvider.value.services.length) {
      this.services = this.form.controls._serviceProvider.value.services;
    }

    this.horseFunction = this.updateHorse.bind(this);
    this.dateFunction = this.updateDate.bind(this);
    // Bind 'this' since the submit function is a callback
    this.submitFunction = this.submit.bind(this);
  }

  /**
   * If form is dirty, confirm that user wants to leave before dismissing view
   */
  dismiss() {
    if (this.formDirty()) {
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

  // See if the form is dirty
  formDirty() {
    return this.form.dirty ||
      this.selectedServices.length ||
      this.form.value._show;
  }

  /**
   * Dismiss all custom invoice views
   * @param {ViewCtrl} confirmViewCtrl The confirm invoice view controller
   */
  dismissCustomInvoiceViews(confirmViewCtrl: ViewController) {
    this.viewCtrl.dismiss({ refreshHorseDetail: true })
      .then(() => {
        confirmViewCtrl.dismiss();
      });
  }

  /**
   * Create a new request and create an invoice for it if createInvoice = true
   * @param {Request}    request The Request object
   * @param {boolean = false}    createInvoice Whether or not an invoice should be created
   * @param {confirmViewCtrl}    confirmViewCtrl Confirm invoice view controller
   */
  async submit(request: Request, createInvoice: boolean = false, confirmViewCtrl: ViewController) {
    if (request) {
      if (!request._show.name) {
        delete request._show;
        delete request.competitionClass;
      }
      try {
        // Create the request
        request.addedToInvoice = createInvoice;
        const newRequest = await this.requestService.create(request);

        if (createInvoice) {
          let invoice = new Invoice();
          invoice._horse = newRequest._horse;
          invoice._requests = [newRequest];

          // Create the invoice
          try {
            const newInvoice = await this.invoiceService.create(invoice);
            this.isSubmitting = false;

            this.dismissCustomInvoiceViews(confirmViewCtrl);
            this.requestService.handleSuccess('Invoice has been submitted');
          } catch (error) {
            this.isSubmitting = false;
            const message = error.json().message || 'There was an error.';
            this.requestService.handleError(message);
          }
        } else {
          this.isSubmitting = false;

          this.dismissCustomInvoiceViews(confirmViewCtrl);
          this.requestService.handleSuccess('Invoice saved to drafts');
        }
      } catch (error) {
        this.isSubmitting = false;
        const message = error.json().message || 'There was an error.';
        this.requestService.handleError(message);
      }
    }
  }

  /**
   * Returns true if the service is currently in the list of selected service items, false if not
   * @param {any} service The service to be checked against the selected list
   */
  inServiceList(service: any) {
    const selectedIds = this.selectedServices.map((selectedService) => { return selectedService._id; });
    return selectedIds.includes(service._id);
  }

  // Attaches newly set name on service card to the form's value
  setServiceName(service: any, event: any) {
    const name = event.value;
    const serviceId = service._id;
    this.form.controls.services.value.forEach((formService, index) => {
      if (serviceId === formService._id) {
        formService.service = name;
        this.selectedServices[index].service = name;
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
        this.selectedServices[index].rate = rate;
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
        this.selectedServices.forEach((selectedService) => {
          if (serviceId === selectedService._id) {
            selectedService.quantity = quantity;
          }
        });
      }
    });
    this.validateServices();
  }

  /**
   * Make sure there are no services with an empty name, rate, or quantity
   */
  validateServices() {
    this.servicesError = false;
    this.noServicesSelected = false;
    if (!this.selectedServices.length) {
      this.noServicesSelected = true;
    }
    this.selectedServices.forEach((service) => {
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
   * Scroll to the service input section
   * If we do not manually scroll the keyboard will cover the input
   */
  scrollToServiceInput(index: number) {
    // Clear the page header when scrolling
    const pageHeaderClearance = 100;
    // Clear the horse info div when scrolling, if a horse is selected
    const horseDivClearance = this.form.controls._horse.value ? 250 : 0;
    const leasedToClearance = this.form.controls._horse.value && this.form.controls._horse.value._leasedTo ? 100 : 0;
    if (this.platform.is('cordova')) {
      // Add to the scroll pixels based on which service is being edited
      let yOffset = pageHeaderClearance + horseDivClearance + leasedToClearance + (66 * index);
      this.content.scrollTo(0, yOffset, 500);
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
      this.selectedServices.push(addedService);
      const control = <FormArray>this.form.controls.services;
      control.push(
        this.formBuilder.group({
          service: [addedService.service, [Validators.required]],
          rate: [addedService.rate, [Validators.required]],
          quantity: [addedService.quantity, [Validators.required]],
          _id: [addedService._id, [Validators.required]],
        }),
      );
      this.updateServices(this.selectedServices);
    } else {
      this.servicesError = true;
    }
    // Prepare and validate to generate errors for the new empty input and prevent saving blank services
    // this.prepServicesForConfirmation();
    this.validateServices();
  }

  /**
   * Remove service from services array
   * @param {number} i index of service in services array
   */
  removeService(i: number) {
    // Take the service off the displayed list
    const removedService = this.selectedServices.splice(i, 1)[0];
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
   * Update all services in form by clearing services and re-adding to form
   */
  updateServices(services: any, fromSelectExit: boolean = false) {
    // Clear form array
    this.form.controls.services = this.formBuilder.array([]);
    // Assemble currently selected service IDs for inclusion checking in a later step
    const selectedIds = this.selectedServices.map((service) => { return service._id; });
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
        this.selectedServices.push(service);
      }
    });
    // If exiting a select view this update, remove de-selected services from the displayed list
    if (fromSelectExit) {
      // Get the list of non-custom services that are being deselected
      const deselectedServices = this.selectedServices.filter((svc) => { return !services.includes(svc) && !svc.isCustom; });
      const deselectedIds = deselectedServices.map((s) => { return s._id; });
      this.selectedServices.forEach((listedService, index) => {
        if (deselectedIds.includes(listedService._id)) {
          this.selectedServices.splice(index, 1);
        }
      });
    }
    // Patch value to update form value
    this.form.patchValue({
      services: services,
    });
    this.validateServices();
  }

  /**
   * Navigate to search modal if creating a new request or changing service provider
   * @param {Function} selectFunction  Function to use when selecting an item
   * @param {string}   placeholderText Placeholder text for searchbar
   */
  goToHorseSearchModal(selectFunction: Function, placeholderText: string) {
    if (!this.request || this.updatingHorse) {
      const params = {
        searchPlaceholder: placeholderText,
        serviceType: 'horseService',
        selectFunction: selectFunction,
        role: 'horse',
      };

      const searchModal = this.modalCtrl.create(this.searchPage, params);
      searchModal.present();
    }
  }

  /**
   * Update the value of _horse
   * @param {any} user The user object
   */
  updateHorse(horse: Horse) {
    this.form.patchValue({
      _horse: horse,
    });
    this.validateServices();
    this.newHorseSelected = true;
  }

  // Date setter function passed to the calendar component when it is opened
  updateDate(date: any) {
    // Save just the mm/dd/yyyy part of the date string
    this.date = date.toLocaleString().split(',')[0];
    this.form.patchValue({
      date: this.date,
    });
  }

  // Open calendar datepicker and pass in bound date setter function and the current date value
  goToCalendarModal(calendarOptions: any) {
    const params: {
      dateChangeFunction: Function,
      selectedDate: any,
    } = {
      dateChangeFunction: calendarOptions.function,
      selectedDate: this.cleanUpDate(calendarOptions.date),
    };
    const calendarModal = this.modalCtrl.create(this.calendarPage, params);
    calendarModal.present();
  }

  // Reads text input and sets date
  setDateFromInput(dateInput: any) {
    this.date = dateInput.value;
  }

  /**
   * Keyword search shows
   */
  async searchShows() {
    if (this.searchText.length) {
      const searchResults = await this.showService.query({ searchTerm: this.searchText });
      this.shows = searchResults;
    } else {
      this.shows = [];
    }
  }

  clearShowSearch() {
    this.showSearchTerm = '';
    this.searchText = '';
    this.shows = [];
  }

  /**
   * Update the _show field in this.form
   * @param {Show} show The Show object
   */
  chooseShow(show: Show) {
    this.form.patchValue({
      _show: show,
    });

    this.clearShowSearch();
  }

  // Do not allow user to add more than 300 characters to the instructions
  // Android does not respect the maxlength html property so we add a check here
  maxLength() {
    if (this.form.controls.instructions.value >= 300) {
      this.form.patchValue({
        instructions: this.form.controls.instructions.value.substring(0, 300),
      });
    }
  }

  // Standardizes date format passed to calendar since "mixed-date/formats" return strange values
  cleanUpDate(date: any) {
    if (date._isAMomentObject) {
      return date;
    }
    return date.replace(/-/g, '/');
  }

  /**
   * Go to the request confirmation page
   */
  goToConfirmation() {
    // Re-update to catch any custom services that form controls missed
    this.updateServices(this.selectedServices);
    this.submitAttempt = true;

    if (this.form.valid && this.submitFunction && this.form.controls.services.value.length) {
      // User-typed dates may be poorly formatted; check if date already momentized and fix if not
      if (!this.form.value.date._isAMomentObject) {
        // Standardize date formatting, replacing dashes with slashes
        let cleanDate = this.cleanUpDate(this.form.value.date);
        // Correct for Chrome/Android behavior that overwrites the "year" in an invalid date as 2001
        // (1-2 month digits, a slash/dash, 1/2 more day digits, a slash/dash, 2 or more year digits)
        const pattern = /\d{1,2}[-\/]\d{1,2}[-\/]\d{2,}/;
        const match = pattern.exec(cleanDate);
        if (!match) {
          // If the user hasn't provided a full date, add current year to string before converting
          const year = new Date().getFullYear();
          cleanDate += `/${year}`;
        }
        // Run date through moment and save as datetime
        this.form.value.date = moment(cleanDate);
      } else {
        this.form.value.date = moment(this.form.value.date);
      }

      // Add total for display on the confirmation page
      this.form.value.total = 0;
      this.form.controls.services.value.forEach((service) => {
        this.form.value.total += (+service.rate * (+service.quantity || 1));
      });

      // Add form fields to request model
      for (let key in this.form.value) {
        if (this.form.value.hasOwnProperty(key)) {
          this.requestService.request[key] = this.form.value[key];
        }
      }

      const data = {
        form: this.form,
        submitFunction: this.submitFunction,
      };

      const customInvoiceConfirmModal = this.modalCtrl.create(CustomInvoiceConfirmPage, data, { enableBackdropDismiss: false });
      customInvoiceConfirmModal.present();
    } else {
      this.content.scrollToTop();
    }
  }
}
