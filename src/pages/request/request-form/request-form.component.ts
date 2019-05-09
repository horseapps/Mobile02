import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Content, ModalController, NavParams, Select, Platform } from 'ionic-angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { Horse } from '../../horse/horse';
import { Request } from '../request';
import { Show } from '../../show/show';
import { ShowService } from '../../show/show.service';
import { SearchPage } from '../../../components/search/search.component';
import { RequestConfirmPage } from '../request-confirm/request-confirm.component';
import { CalendarPage } from '../../../components/calendar/calendar.component';
import { RequestService } from '../request.service';
import { UserService } from './../../user/user.service';
import { HorseService } from './../../horse/horse.service';
import { ConstantsService } from '../../../providers/constants.service';
import moment from 'moment';

@Component({
  selector: 'page-request-form',
  templateUrl: 'request-form.html',
})
export class RequestFormPage implements OnInit {
  searchPage: any = SearchPage;
  requestConfirmPage: any = RequestConfirmPage;
  calendarPage: any = CalendarPage;
  form: FormGroup;
  submitAttempt: boolean = false;
  isSubmitting: boolean = false;
  showSearchTerm: string = '';
  searchText: string;
  horseShows: any[] = [];
  @Input() request: Request;
  @Input() submitFunction: Function;
  serviceProviderFunction: Function;
  dateFunction: Function;
  minYear: any = moment().startOf('year').format();
  maxYear: any = moment(this.minYear).add(2, 'years').endOf('year').format();
  services: any = [];
  @ViewChild('serviceSelector') serviceSelector: Select;
  @ViewChild('content') content: Content;
  selectedServices: any = [];
  originalServices: any = [];
  horse: Horse;
  updatingServiceProvider: boolean;
  newProviderSelected: boolean;
  date: any;
  servicesError: boolean = false;

  constructor(
    public formBuilder: FormBuilder,
    public requestService: RequestService,
    public constants: ConstantsService,
    public userService: UserService,
    public horseService: HorseService,
    public showService: ShowService,
    public modalCtrl: ModalController,
    public navParams: NavParams,
    private platform: Platform,
   ) {
    this.horse = this.navParams.get('horse');
    this.updatingServiceProvider = this.navParams.get('updatingServiceProvider');
    // Set request date to noon (time is never displayed, only date)
    this.date = moment().set({ 'hour': 12, 'minute': 0, 'second': 0 }).format('MM/DD/YYYY');
  }

  ngOnInit() {
    this.form = this.formBuilder.group({
      _show: this.formBuilder.group({
        name: [''],
        _id: [''],
      }),
      date: [this.date.toLocaleString().split(',')[0], Validators.compose([Validators.required])],
      competitionClass: [''],
      _serviceProvider: ['', Validators.compose([Validators.required])],
      services: this.formBuilder.array([]),
      instructions: [''],
      _horse: [this.horse, Validators.compose([Validators.required])],
      total: [''],
    });

    // If user has previous requests, get the latest one so we can
    // pre-populate the last service provider used
    if (!this.request) {
      this.getLastRequest();
      this.getLastRequestForHorse();
    }

    // Update the fields if there is an existing request
    if (this.request) {
      this.request.date = moment(this.request.date).format('MM/DD/YYYY');

      // Update services
      if (!this.updatingServiceProvider) {
        this.services = this.request._serviceProvider.services;
        this.updateServices(this.request.services);
      } else {
        // Update original service list if there is an existing request
        this.originalServices = [];
      }

      this.form.patchValue({
        _show: this.request._show || this.formBuilder.group({
          name: [''],
          _id: [''],
        }),
        date: this.request.date.toLocaleString().split(',')[0],
        competitionClass: this.request.competitionClass,
        _serviceProvider: this.request._serviceProvider,
        instructions: this.request.instructions,
        total: [''],
      });
    }
    this.serviceProviderFunction = this.updateServiceProvider.bind(this);
    this.dateFunction = this.updateDate.bind(this);
  }

  /**
   * Get the latest service request created by req.user
   */
  async getLastRequest() {
    const lastRequest = await this.requestService.get('last');

    // Pre-populate form with _serviceProvider from last request
    if (lastRequest && lastRequest._serviceProvider) {
      this.form.patchValue({
        _serviceProvider: lastRequest._serviceProvider,
      });

      if (this.form.controls._serviceProvider.value.services.length) {
        this.services = this.form.controls._serviceProvider.value.services;
      }
    }

    // Pre-populate form with _show from last request
    if (lastRequest && lastRequest._show) {
      this.form.patchValue({
        _show: lastRequest._show,
      });
    }
  }

  /**
   * Get the latest service request created by req.user for horseService.horse
   */
  async getLastRequestForHorse() {
    const lastRequest = await this.requestService.get('last', this.horseService.horse._id);

    // Pre-populate form with competition class from last request
    if (lastRequest && lastRequest.competitionClass) {
      this.form.patchValue({
        competitionClass: lastRequest.competitionClass,
      });
    }
  }

  /**
   * Update all services in form by clearing services and re-adding to form
   */
  updateServices(services: any) {
    // Clear form array
    this.form.controls.services = this.formBuilder.array([]);

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
    });

    // Patch value to update form value
    this.form.patchValue({
      services: services,
    });

    this.selectedServices = services;

    // Update original service list if there is an existing request
    if (this.request) {
      this.originalServices = services;
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

  /**
   * Runs when the user clicks the delete icon next to an added service.
   * Removes the service from the form values so it doesn't end up in Confirm
   * @param {Number} i The list index of the service to be removed
   */
  removeService(i: number) {
    // Remove the service from the displayed list
    const removedService = this.selectedServices.splice(i, 1)[0];

    // Update the form control and remove service from form value
    const control = <FormArray>this.form.controls.services;
    this.form.controls.services.value.forEach((formService, index) => {
      if (removedService._id === formService._id) {
        control.removeAt(index);
        this.form.value.services.splice(index, 1);
      }
    });

    // Remove the service from the ion-select's list of values so the states match
    this.serviceSelector.value.forEach((selection, selectIndex) => {
      if (selection._id === removedService._id) {
        this.serviceSelector.value.splice(selectIndex, 1);
      }
    });
  }

  /**
   * Remove all service form controls and reset services error
   */
  clearAllServices() {
    const control = <FormArray>this.form.controls.services;
    const services = this.form.value.services;
    services.forEach((service, index) => {
      control.removeAt(index);
    });
    this.form.value.services = [];
    this.selectedServices = [];
    this.servicesError = false;
  }

  /**
   * Scroll to the service input section
   * If we do not manually scroll the keyboard will cover the input
   * @param index: number The list index of the focused-on service
   */
  scrollToServiceInput(index: number) {
    // Clear the page header when scrolling
    const pageHeaderClearance = 60;
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
   * Navigate to search modal if creating a new request or changing service provider
   * @param {Function} selectFunction  Function to use when selecting an item
   * @param {string}   placeholderText Placeholder text for searchbar
   */
  goToSearchModal(selectFunction: Function, placeholderText: string) {
    if (!this.request || this.updatingServiceProvider) {
      const params = {
        searchPlaceholder: placeholderText,
        serviceType: 'userService',
        selectFunction: selectFunction,
        role: 'service provider',
      };

      const searchModal = this.modalCtrl.create(this.searchPage, params);
      searchModal.present();
    }
  }

  /**
   * Update the value of _serviceProvider
   * @param {any} user The user object
   */
  updateServiceProvider(user: string) {
    this.form.patchValue({
      _serviceProvider: user,
    });

    // Remove all services because services are based on service provider
    this.clearAllServices();

    if (this.form.controls._serviceProvider.value.services.length) {
      this.services = this.form.controls._serviceProvider.value.services;
    }

    this.newProviderSelected = true;
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
      this.horseShows = searchResults;
    } else {
      this.horseShows = [];
    }
  }

  clearShowSearch() {
    this.showSearchTerm = '';
    this.searchText = '';
    this.horseShows = [];
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

  /**
   * Attaches newly set quantity on service card to the form's value
   * @param {any} service The service object
   * @param {any} input The quantity input
   */
  setServiceQuantity(service: any, input: any) {
    const quantity = input.value || '';
    const serviceId = service._id;
    // Unlike name and rate, the displayed value of and added service's quantity
    // must be manually attached to the underlying service object
    this.form.controls.services.value.forEach((formService) => {
      if (serviceId === formService._id) {
        formService.quantity = quantity;
        this.selectedServices.forEach((listedService) => {
          if (serviceId === listedService._id) {
            listedService.quantity = quantity;
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
    this.submitAttempt = true;

    if (this.form.valid && this.submitFunction && this.form.value.services.length) {
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

      // Add total for display on the confirmation page, accounting for service quantity
      this.form.value.total = 0;
      this.form.value.services.forEach((service) => {
        this.form.value.total += (+service.rate) * (+service.quantity || 1);
      });

      // Add form fields to request model
      for (let key in this.form.value) {
        if (this.form.value.hasOwnProperty(key)) {
          this.requestService.request[key] = this.form.value[key];
        }
      }

      const data =  {
        form: this.form,
        submitFunction: this.submitFunction,
      };

      const requestConfirmModal = this.modalCtrl.create(RequestConfirmPage, data, { enableBackdropDismiss: false });
      requestConfirmModal.present();
    }
  }
}
