import { Component, Input, OnInit } from '@angular/core';
import { ToastController, ViewController, Events, ModalController, AlertController, NavParams } from 'ionic-angular';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SearchPage } from '../../../components/search/search.component';
import { UserServiceProviderConfirmPage } from '../user-service-provider-confirm/user-service-provider-confirm.component';

@Component({
  selector: 'page-user-service-provider-form',
  templateUrl: 'user-service-provider-form.html',
})

export class UserServiceProviderFormPage implements OnInit {
  @Input() providerForManager: {
    _id: any,
    _provider: string,
    label: string,
    customLabel: string,
  };
  @Input() submitFunction: Function;
  searchPage: any = SearchPage;
  form: FormGroup;
  submitAttempt: boolean = false;
  isSubmitting: boolean = false;
  showSearchTerm: string = '';
  searchText: string;
  serviceProviderFunction: Function;
  newProviderSelected: boolean;
  updatingServiceProvider: boolean;

  constructor(
    public userService: UserService,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public events: Events,
    public formBuilder: FormBuilder,
    public modalCtrl: ModalController,
    public navParams: NavParams,
  ) { }

  ngOnInit() {
    this.form = this.formBuilder.group({
      _id: [''],
      _provider: ['', Validators.compose([Validators.required])],
      label: ['', Validators.compose([Validators.required])],
      customLabel: [''],
    });

    this.serviceProviderFunction = this.updateServiceProvider.bind(this);
  }

  updateServiceProvider(user: string) {
    this.form.patchValue({
      _provider: user,
    });
  }

  goToSearchModal(selectFunction: Function, placeholderText: string) {
    this.updatingServiceProvider = true;
    const params = {
      searchPlaceholder: placeholderText,
      serviceType: 'userService',
      selectFunction: selectFunction,
      role: 'service provider',
    };
    this.updatingServiceProvider = false;
    const searchModal = this.modalCtrl.create(this.searchPage, params);
    searchModal.present();
  }

  goToConfirmation() {
    this.submitAttempt = true;
    if (this.form.valid && this.submitFunction && this.form.value._provider) {
      const data = {
        form: this.form,
        submitFunction: this.submitFunction,
      };

      const serviceProviderConfirmModal = this.modalCtrl.create(
        UserServiceProviderConfirmPage, data, { enableBackdropDismiss: false });
      serviceProviderConfirmModal.present();
    }
  }
}
