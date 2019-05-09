import { Component, OnInit, ViewChild, group } from '@angular/core';
import { ViewController, ModalController, ToastController, AlertController, Events, NavParams, Content, Platform } from 'ionic-angular';
import { Invoice } from '../invoice';
import { UserPublicProfilePage } from '../../user/user-public-profile/user-public-profile.component';
import { HorsePublicProfilePage } from '../../horse/horse-public-profile/horse-public-profile.component';
import { Request } from '../../request/request';
import { Horse } from '../../horse/horse';
import { RequestService } from '../../request/request.service';
import { InvoiceService } from '../../invoice/invoice.service';
import { ConstantsService } from '../../../providers/constants.service';
import { UserService } from '../../user/user.service';
import { AuthService } from '../../auth/auth.service';
import { HorseService } from '../../horse/horse.service';
import { UtilityService } from '../../../providers/utility.service';
import { NavController } from 'ionic-angular';
import _ from 'lodash';

@Component({
  selector: 'page-invoice-edit',
  templateUrl: 'invoice-edit.html',
})

export class InvoiceEditPage implements OnInit {
  isSubmitting: boolean = false;
  isDeletingInvoice: boolean = false;
  requests: Request[] = [];
  allServicesValid: boolean;
  invoice: Invoice;
  detailViewCtl: ViewController;
  servicesError: boolean;
  @ViewChild('content') content: Content;

  constructor(
    public requestService: RequestService,
    public invoiceService: InvoiceService,
    public userService: UserService,
    public authService: AuthService,
    public horseService: HorseService,
    public navCtrl: NavController,
    public navParams: NavParams,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private modalCtrl: ModalController,
    public events: Events,
    public alertCtrl: AlertController,
    public constants: ConstantsService,
    public utilityService: UtilityService,
    private platform: Platform,
  ) {}

  ngOnInit() {
    this.invoice = this.navParams.get('invoice');
    this.detailViewCtl = this.navParams.get('detailViewCtrl');

    // Make copy of requests sent in nav params
    this.requests = this.navParams.get('requests').map((request) => {
      return JSON.parse(JSON.stringify(request));
    });

    this.setDefaultServiceQuantities();
    this.validateAllServices();
  }

  // Sets each service quantity to a default of 1 to gracefully degrade pre-quantified services
  setDefaultServiceQuantities() {
    this.requests.forEach((request) => {
      request.services.forEach((service) => {
        if (!service.quantity) {
          service.quantity = 1;
        }
      });
    });
  }

  // Validates all services on the page by passing them through the per-request validator
  validateAllServices() {
    this.allServicesValid = true;
    this.requests.forEach((request, requestIndex) => {
      this.validateServicesForRequest(request, requestIndex);
      if (this.requests[requestIndex].servicesError) {
        this.allServicesValid = false;
        return;
      }
    });
  }

  /**
   * Add empty service to services array
   * @param {object} request The Request object
   */
  addService(request: Request, requestIndex: number) {
    // Only allow user to add a service if all other services are valid
    this.validateServicesForRequest(request, requestIndex);
    if (!this.requests[requestIndex].servicesError ||
      !request.services.length) {
      request.services.push({ service: '', rate: '', quantity: 1, isCustom: true, addedThisVisit: true });
    } else {
      this.requests[requestIndex].servicesError = true;
    }
  }

  /**
   * Remove service from services array
   * @param {number} i index of service in services array
   */
  removeService(request: Request, i: number) {
    request.services.splice(i, 1);
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
   * Make sure there are no services with an empty name or rate
   * @param {object} request The Request object
   */
  validateServicesForRequest(request: Request, requestIndex: number) {
    this.requests[requestIndex].servicesError = false;

    // There must be at least one service per request
    if (!request.services.length) {
      this.requests[requestIndex].servicesError = true;
    }

    request.services.forEach((service) => {
      if (!service.service.length || service.rate < 1 || !this.wholeNumber(service.quantity)) {
        this.requests[requestIndex].servicesError = true;
      }
    });
  }

  /**
   * Scroll to the service input section
   * If we do not manually scroll the keyboard will cover the input
   * @param requestIndex: number The group's index of the service's request
   * @param index: number The request's index of the focused-on service
   */
  scrollToServiceInput(requestIndex: number, serviceIndex: number) {
    if (this.platform.is('cordova')) {
      // Account for previous requests, and services on the page
      let requestsAboveThisServiceCount = requestIndex;
      let servicesAboveThisServiceCount = 0;
      let maxRequestIndex = requestIndex;

      for (let ri = 0; ri < maxRequestIndex; ri++) {
        servicesAboveThisServiceCount += this.requests[ri].services.length;
      }

      servicesAboveThisServiceCount += serviceIndex;

       // Clear the page header and form fields when scrolling
      const pageHeaderClearance = 85;

      // There is a set of request headers and fields for each request on the page
      const requestFieldsClearance = 170 * (requestsAboveThisServiceCount);

      // Set the height of each service card
      const serviceCardHeight = 66;
      // Clear all service cards above this one
      const servicesClearance = serviceCardHeight * servicesAboveThisServiceCount;
       // Add to the scroll pixels based on which service is being edited
      let yOffset = pageHeaderClearance + requestFieldsClearance + servicesClearance;

      // Prevent android devices from scrolling too far
      if (this.platform.is('android')) {
        yOffset -= 200;
      }
      this.content.scrollTo(0, yOffset, 500);
    }
  }

  /**
   * Go to public profile for a horse
   * @param {Horse}       horse The horse object
   */
  goToPublicHorseProfile(horse: Horse) {
    const data = {
      horseId: horse._id,
    };

    const publicHorseProfileModal = this.modalCtrl.create(HorsePublicProfilePage, data, { enableBackdropDismiss: false });
    publicHorseProfileModal.present();
  }

  /**
   * Update the data in invoice detail with new updated request
   * @param {Request} requests       Array of request objects
   * @param {Request} updatedRequest The updated request object
   */
  updateRequests(requests: Request[], updatedRequest: Request) {
    let index = requests.findIndex((o) => o._id === updatedRequest._id);
    if (index > -1) {
      requests[index] = updatedRequest;
    }
  }

  async submit() {
    // We need to validate all services for every request before submitting
    this.validateAllServices();
    if (this.allServicesValid) {
      try {
        this.isSubmitting = true;

        const boundRequests = this.navParams.get('requests');

        if (this.invoice) {
          const invoice = this.invoice;
          invoice._requests = this.requests;
          const updatedInvoice = await this.invoiceService.update(invoice);
        } else {
          // Update each request via API and then update the requests in the detail view
          await Promise.all(this.requests.map(async (request) => {
            const updatedRequest = await this.requestService.update(request);
            this.updateRequests(boundRequests, updatedRequest);
          }));
        }

        this.isSubmitting = false;
        this.utilityService.successToast('Invoice updated');

        // Update the request list view and dismiss modal
        this.events.publish('request:refresh-list');
        this.viewCtrl.dismiss();
      } catch (error) {
        this.isSubmitting = false;
        const message = error.json().message || 'There was an error.';
        this.utilityService.errorToast(message);
      }
    } else {
      const message = 'All requests must have at least one valid service with a name and rate of at least $1.00.';
      this.utilityService.errorToast(message);
    }
  }

  /**
   * Dismiss invoice detail view and this view
   */
  dismissViews() {
    this.detailViewCtl.dismiss()
      .then(() => {
        this.viewCtrl.dismiss();
      });
  }

  deleteInvoice() {
    let confirm = this.alertCtrl.create({
      title: 'Delete Invoice?',
      message: 'Are you sure you want to delete this invoice? All requests on this invoice will also be deleted.',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            this.isDeletingInvoice = true;

            // If there is an invoice, we delete that AND the requests
            // If no invoice, just delete the requests
            if (this.invoice) {
              this.invoiceService.delete(this.invoice)
                .then((response) => {
                  this.isDeletingInvoice = false;
                  this.utilityService.successToast('Invoice has been deleted');
                  // Remove from request list and invoice list
                  this.invoiceService.removeInvoice(this.invoice._id);
                  this.events.publish('request:created/updated');
                  this.dismissViews();
                })
                .catch((error) => {
                  this.isDeletingInvoice = false;
                  const message = error.json().message || 'There was an error.';
                  this.utilityService.errorToast(message);
                });
            } else {
              const requestIds = this.requests.map((request) => request._id);
              this.requestService.deleteMultiple(requestIds)
                .then((response) => {
                  this.isDeletingInvoice = false;
                  this.utilityService.successToast('Invoice has been deleted');
                  this.events.publish('request:refresh-list');
                  this.events.publish('invoice:created/updated');
                  this.dismissViews();
                })
                .catch((error) => {
                  this.isDeletingInvoice = false;
                  const message = error.json().message || 'There was an error.';
                  this.utilityService.errorToast(message);
                });
            }
          },
        },
      ],
    });

    confirm.present();
  }
}
