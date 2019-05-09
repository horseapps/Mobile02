import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Content, ModalController, ViewController, ToastController, AlertController, Events, NavController, Platform } from 'ionic-angular';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { User } from '../../user/user';
import { Horse } from '../horse';
import { SearchPage } from '../../../components/search/search.component';
import { HorseService } from '../horse.service';
import { UserService } from './../../user/user.service';
import { AuthService } from './../../auth/auth.service';
import { ConstantsService } from '../../../providers/constants.service';
import { ValidationService } from '../../../components/control-errors/validation.service';
import moment from 'moment';

interface SearchOptions {
  function: Function;
  placeholderText: string;
  index?: number;
  ownerSearch?: boolean;
}

@Component({
  selector: 'page-horse-form',
  templateUrl: 'horse-form.html',
})
export class HorseFormPage implements OnInit {
  @ViewChild('content') content: Content;
  searchPage: any = SearchPage;
  form: FormGroup;
  submitAttempt: boolean = false;
  isSubmitting: boolean = false;
  fileUri: string;
  fileStatus: string;
  fileProgress: number;
  searchTerm: string = '';
  horseManagers: User[] = [];
  @Input() horse: Horse;
  @Input() submitFunction: Function;
  @Input() contentTemplateVariable: any;
  trainerFunction: Function;
  leasedToFunction: Function;
  ownerFunction: Function;
  registrationError: boolean;
  gender: string;
  minYear: any = moment().subtract(30, 'years').format();

  constructor(
    public formBuilder: FormBuilder,
    public horseService: HorseService,
    public navCtrl: NavController,
    public constants: ConstantsService,
    public userService: UserService,
    public authService: AuthService,
    public modalCtrl: ModalController,
    public alertCtrl: AlertController,
    public toastCtrl: ToastController,
    public viewCtrl: ViewController,
    public platform: Platform,
    private events: Events,
    private validationService: ValidationService,
   ) {
  }

  ngOnInit() {
    // Create a blank form
    this.form = this.formBuilder.group({
      barnName: ['', Validators.compose([Validators.required])],
      showName: ['', Validators.compose([Validators.required])],
      gender: ['', Validators.compose([Validators.required])],
      birthYear: [''],
      color: ['', Validators.compose([this.validationService.maxLength50])],
      sire: ['', Validators.compose([this.validationService.maxLength50])],
      dam: ['', Validators.compose([this.validationService.maxLength50])],
      height: ['', Validators.compose([this.validationService.validHeight])],
      description: [''],
      _trainer: [this.authService.currentUser, Validators.compose([Validators.required])],
      _owners: this.formBuilder.array([]),
      _leasedTo: [],
      registrations: this.formBuilder.array([
        this.initRegistration(),
      ]),
    });

    // Update the fields if there is an existing horse
    if (this.horse) {
      // Set gender so the select is populated
      this.gender = this.horse.gender;
      this.addRegistrations();

      if (this.horse._owners) {
        this.populateOwners();
      }

      this.form.patchValue({
        barnName: this.horse.barnName,
        showName: this.horse.showName,
        gender: this.horse.gender,
        birthYear: this.horse.birthYear,
        color: this.horse.color,
        sire: this.horse.sire,
        dam: this.horse.dam,
        height: this.horse.height,
        description: this.horse.description,
        _trainer: this.horse._trainer,
        _owners: this.horse._owners,
        _leasedTo: this.horse._leasedTo,
      });
    }

    this.trainerFunction = this.updateTrainer.bind(this);
    this.leasedToFunction = this.updateLeasedTo.bind(this);
    this.ownerFunction = this.addOwner.bind(this);
  }

  /**
   * Populate registration form array
   */
  addRegistrations() {
    this.horse.registrations.forEach((registration, index) => {
      const control = this.form.get('registrations') as FormArray;
      control.insert(
        index,
        this.formBuilder.group({
          name: [registration.name],
          number: [registration.number],
        }),
      );
    });
  }

  populateOwners() {
    this.horse._owners.forEach((owner, index) => {
      const control = this.form.get('_owners') as FormArray;
      control.insert(
        index,
        this.formBuilder.group({
          _user: [owner._user, [Validators.required]],
          percentage: [owner.percentage, Validators.compose([Validators.required, this.validationService.wholeNumber])],
        }),
      );
    });
  }

  /**
   * Initialize registrations array with blank form group
   */
  initRegistration() {
    return this.formBuilder.group({
      name: [''],
      number: [''],
    });
  }

  /**
   * Add registration to form array group
   */
  addRegistration() {
    if (this.form.controls.registrations.valid) {
      const control = <FormArray>this.form.controls.registrations;
      control.push(this.initRegistration());
    }
  }

  /**
   * Remove registration from form array group
   * @param {number} i index of registration in form array
   */
  removeRegistration(i: number) {
    const control = <FormArray>this.form.controls.registrations;
    control.removeAt(i);
  }

  goToSearchModal(searchOptions: SearchOptions) {
      const params: {
        searchPlaceholder: string,
        serviceType: string,
        selectFunction: Function,
        role: string,
        index?: number,
        excludeIds?: string[],
      } = {
        searchPlaceholder: searchOptions.placeholderText,
        serviceType: 'userService',
        selectFunction: searchOptions.function,
        role: 'horse manager',
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
   * Clear out the ownership percentage and mark as pristine
   * @param {FormArray} ownerFormArray Array of owner form control groups
   */
  clearOwnerPercentage(ownerFormArray: FormArray) {
    for (let i = 0; i < ownerFormArray.length; i++) {
      ownerFormArray.controls[i].patchValue({
        percentage: 0,
      });
      ownerFormArray.controls[i].markAsPristine();
    }
  }

  /**
   * Add user to _owners form array group or change the owner previously added
   * @param {Object} user The user object
   */
  addOwner(user: User, index?: number) {
    const ownerFormArray = <FormArray>this.form.controls._owners;

    // If an index is given, we are changing an owner that was already added
    // Otherwise, we add to the array of owners
    if (index >= 0) {
      ownerFormArray.controls[index].patchValue({
        _user: user,
      });
    } else {
      ownerFormArray.push(
        this.formBuilder.group({
          _user: [user, [Validators.required]],
          percentage: [0, Validators.compose([Validators.required, this.validationService.wholeNumber])],
        }),
      );
    }

    this.clearOwnerPercentage(ownerFormArray);
  }

  /**
   * Remove service from form array group
   * @param {number} i index of service in form array
   */
  removeOwner(index: number) {
    const ownerFormArray = <FormArray>this.form.controls._owners;
    ownerFormArray.removeAt(index);
    this.clearOwnerPercentage(ownerFormArray);
  }

  /**
   * Update the value of _trainer
   * @param {any} user The user object
   */
  updateTrainer(user: string) {
    this.form.patchValue({
      _trainer: user,
    });
  }

  /**
   * Update the value of _leasedTo
   * @param {any} user The user object
   */
  updateLeasedTo(user: string) {
    this.form.patchValue({
      _leasedTo: user,
    });
  }

  /**
   * Remove the value of _leasedTo,
   * returning horse ownership to tthe original owner
   * @param {any} user The user object
   */
  removeLeasedTo() {
    this.form.patchValue({
      _leasedTo: null,
    });
  }

  validateRegistrations() {
    this.registrationError = false;
    this.form.value.registrations.forEach((registration) => {
      if (!registration.name.length && registration.number.length) {
        this.registrationError = true;
      }
    });
  }

  updateGender(gender: any) {
    this.form.patchValue({
      gender: gender,
    });
  }

  /**
   * Updates or creates a horse
   */
  submit() {
    this.submitAttempt = true;
    this.validateRegistrations();

    if (this.form.valid && this.submitFunction && !this.registrationError) {
      this.isSubmitting = true;

      // Add avatar if there is one
      if (this.horseService.horse.avatar) {
        this.form.value.avatar = this.horseService.horse.avatar;
      }

      // Add form fields to horse model
      for (let key in this.form.value) {
        if (this.form.value.hasOwnProperty(key)) {
          this.horseService.horse[key] = this.form.value[key];
        }
      }

      // Ensure that the _owner property is removed from the horse object
      delete this.horseService.horse._owner;
      this.submitFunction(this.horseService.horse, this.form);
    }
  }

  /**
   * Delete a horse profile
   */
  async deleteHorse() {
    let confirm = this.alertCtrl.create({
      title: 'Really Delete?',
      message: 'Are you sure you want to delete this horse?',
      buttons: [
        { text: 'Cancel' },
        {
          text: 'OK',
          handler: () => {
            this.horseService.delete(this.horse._id)
              .then((response) => {
                // Refresh horse list
                this.events.publish('horse:refresh-list');

                this.successToast('Your horse has been deleted.');

                // Publish event so we know to dismiss the horse detail view before
                // dismissing edit view
                this.events.publish('horse:deleted');
                this.viewCtrl.dismiss();
              })
              .catch((error) => {
                const message = error.json().message || 'There was an error.';
                this.horseService.handleError(message);
              });
          },
        },
      ],
    });

    confirm.present();
  }

  successToast(message: string) {
    const toast = this.toastCtrl.create({
      message: message,
      duration: 3000,
      cssClass: 'toast-success',
    });

    toast.present();
  }

  // Do not allow user to add more than 50 characters to a given form value
  // Android does not respect the maxlength html property so we add a check here
  maxLength(formValue: string, controlName: string): void {
    if (formValue.length > 50) {
      formValue = formValue.substring(0, 50);
      this.form.controls[controlName].setValue(formValue);
    }
  }

  shouldDisableSaveButton() {
    return this.isSubmitting ||
      !this.form.valid ||
      this.registrationError ||
      (this.form.controls._owners.value.length && this.ownershipTotal() !== 100);
  }

  /**
   * Calculate the percentage of all owners and return if ownership values are valid
   */
  ownershipTotal() {
    const sum = this.form.controls._owners.value.reduce(
      (accumulator, currentValue) => {
        return accumulator + +currentValue.percentage;
      },
      0,
    );

    return sum || 0;
  }

  /**
   * Scroll to the owner input section
   * If we do not manually scroll the keyboard will cover the input
   */
  scrollToOwnerInput() {
    if (this.platform.is('cordova')) {
      let yOffset = document.getElementById('owner-section').offsetTop;
      this.contentTemplateVariable.scrollTo(0, yOffset, 1000);
    }
  }

  /**
   * Clears the value of a given form input
   * @param input The form input to be cleared
   */
  clearValue(input: any) {
    input.value = '';
  }
}
