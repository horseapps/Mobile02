import { NavParams, Content, Platform, Select } from 'ionic-angular';
import { NavController, ModalController, ViewController, AlertController, ToastController, Events } from 'ionic-angular';
import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { CalendarComponent } from 'ionic2-calendar/calendar';
import { InvoiceService } from '../invoice.service';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../../user/user.service';
import { HorseService } from '../../horse/horse.service';
import { SearchPage } from '../../../components/search/search.component';
import { CalendarPage } from '../../../components/calendar/calendar.component';

interface SearchOptions {
  function: Function;
  placeholderText: string;
  index?: number;
  ownerSearch?: boolean;
}

@Component({
  selector: 'page-invoice-export',
  templateUrl: 'invoice-export.html',
})

export class InvoiceExportPage implements OnInit {
  searchPage: any = SearchPage;
  calendarPage: any = CalendarPage;
  form: FormGroup;
  horseManagersFunction: Function;
  serviceProvidersFunction: Function;
  horsesFunction: Function;
  sinceDateFunction: Function;
  untilDateFunction: Function;
  horseManagers: any = [];
  serviceProviders: any = [];
  horses: any = [];
  sinceDate: any;
  untilDate: any;

  constructor(
    public viewCtrl: ViewController,
    private modalCtrl: ModalController,
    public invoiceService: InvoiceService,
    private authService: AuthService,
    private userService: UserService,
    private horseService: HorseService,
    public formBuilder: FormBuilder,
    public events: Events,
    private toastCtrl: ToastController,
  ) { }

  ngOnInit(): void {
    this.form = this.formBuilder.group({
      userType: this.authService.isManager() ? 'horse manager' : 'service provider',
      paymentType: 'all',
      sinceDate: null,
      untilDate: null,
      serviceProviders: [[]],
      horseManagers: [[]],
      horses: [[]],
    });
    this.horseManagersFunction = this.updateHorseManagers.bind(this);
    this.serviceProvidersFunction = this.updateServiceProviders.bind(this);
    this.horsesFunction = this.updateHorses.bind(this);
    this.sinceDateFunction = this.updateSinceDate.bind(this);
    this.untilDateFunction = this.updateUntilDate.bind(this);
  }

  dismiss() {
    this.viewCtrl.dismiss();
  }

  goToSearchModal(searchOptions: any) {
    const params: {
      searchPlaceholder: string,
      serviceType: string,
      selectFunction: Function,
      role: string,
      index?: number,
      excludeIds?: string[],
    } = {
      searchPlaceholder: searchOptions.placeholderText,
      serviceType: searchOptions.serviceType,
      selectFunction: searchOptions.function,
      role: searchOptions.role,
    };

    // If an index is sent, this means we are replacing an owner
    // We will not want that owner to show up in the search results so we send it as a param
    if (searchOptions.index >= 0) {
      params.index = searchOptions.index;
    }

    // If we are doing an owner search, we need to send a list of ids to exclude from search results
    if (searchOptions.ownerSearch) {
      params.excludeIds = this.form.value._owners.map((owner) => owner._user._id);
    }

    const searchModal = this.modalCtrl.create(this.searchPage, params);
    searchModal.present();
  }

  /**
   * Update the value of horseManagers
   * @param {any} user The user object
   */
  updateHorseManagers(user: any) {
    const managerIds = this.horseManagers.map((m) => String(m._id));
    if (!managerIds.includes(String(user._id))) {
      this.horseManagers.push(user);
      this.form.patchValue({
        horseManagers: this.horseManagers,
      });
    }
  }

  /**
   * Update the value of serviceProviders
   * @param {any} user The user object
   */
  updateServiceProviders(user: any) {
    const providerIds = this.serviceProviders.map((p) => String(p._id));
    if (!providerIds.includes(String(user._id))) {
      this.serviceProviders.push(user);
      this.form.patchValue({
        serviceProviders: this.serviceProviders,
      });
    }
  }

  /**
   * Update the value of horses
   * @param {any} user The user object
   */
  updateHorses(horse: any) {
    const horseIds = this.horses.map((h) => String(h._id));
    if (!horseIds.includes(String(horse._id))) {
      this.horses.push(horse);
      this.form.patchValue({
        horses: this.horses,
      });
    }
  }

  goToCalendarModal(calendarOptions: any) {
    const params: {
      dateChangeFunction: Function,
      selectedDate: Date,
    } = {
      dateChangeFunction: calendarOptions.function,
      selectedDate: calendarOptions.date,
    };
    const calendarModal = this.modalCtrl.create(this.calendarPage, params);
    calendarModal.present();
  }

  updateSinceDate(date: any) {
    // Save just the mm/dd/yyyy part of the date string
    this.sinceDate = date.toLocaleString().split(',')[0];
    this.form.patchValue({
      sinceDate: this.sinceDate,
    });
  }

  updateUntilDate(date: any) {
    // Save just the mm/dd/yyyy part of the date string
    this.untilDate = date.toLocaleString().split(',')[0];
    this.form.patchValue({
      untilDate: this.untilDate,
    });
  }

  // Updates stored since / until date as the user types it in, so the calendar can open on that date
  setDateFromInput(type: string, dateInput: any) {
    if (type === 'since') {
      this.sinceDate = dateInput.value;
    } else if (type === 'until') {
      this.untilDate = dateInput.value;
    }
  }

  /**
   * Remove horse manager from form array group
   * @param {number} i index of service in form array
   */
  removeManager(index: number) {
    this.horseManagers.splice(index, 1);
    this.form.patchValue({
      horseManagers: this.horseManagers,
    });
  }

  /**
   * Remove service provider from form array group
   * @param {number} i index of service in form array
   */
  removeProvider(index: number) {
    this.serviceProviders.splice(index, 1);
    this.form.patchValue({
      serviceProviders: this.serviceProviders,
    });
  }

  /**
   * Remove horse from form array group
   * @param {number} i index of service in form array
   */
  removeHorse(index: number) {
    this.horses.splice(index, 1);
    this.form.patchValue({
      horses: this.horses,
    });
  }

  exportInvoices() {
    this.invoiceService.exportToCsv(this.form.value)
      .then((response) => {
        if (response.message === 'Invoice export complete') {
          // Success toast
          const message = `Payment records found! You will receive an email shortly with a .csv attachment.`;
          const toast = this.toastCtrl.create({
            cssClass: 'toast-success',
            message: message,
            duration: 3000,
            position: 'bottom',
            showCloseButton: true,
          });
          toast.present();
        } else if (response.message === 'NO INVOICES FOUND') {
          // No invoices found toast
          const message = `Sorry, we couldn't find any invoices matching those conditions. Would you like to try again?`;
          const toast = this.toastCtrl.create({
            cssClass: 'toast-danger',
            message: message,
            duration: 4000,
            position: 'bottom',
            showCloseButton: true,
          });
          toast.present();
        }
      })
      .catch((error) => {
        // If no OK response, something went wrong
        const message = error.json().message || 'There was an error.';
        const toast = this.toastCtrl.create({
          cssClass: 'toast-danger',
          message: message,
          duration: 3000,
          position: 'bottom',
          showCloseButton: true,
        });
        toast.present();
      });
  }
}
