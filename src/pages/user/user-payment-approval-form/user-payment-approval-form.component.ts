import { Component, Input, OnInit } from '@angular/core';
import { ToastController, ViewController, NavController, Events, ModalController, AlertController, NavParams } from 'ionic-angular';
import { AuthService } from '../../auth/auth.service';
import { UserService } from '../user.service';
import { ConstantsService } from '../../../providers/constants.service';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { SearchPage } from '../../../components/search/search.component';
import { UserPaymentApprovalConfirmPage } from '../user-payment-approval-confirm/user-payment-approval-confirm.component';

@Component({
  selector: 'page-user-payment-approval-form',
  templateUrl: 'user-payment-approval-form.html',
})

export class UserPaymentApprovalFormPage implements OnInit {
  @Input() approval: {
    _id: any,
    _approver: string,
    isUnlimited: boolean,
    maxAmount: any };
  @Input() submitFunction: Function;
  searchPage: any = SearchPage;
  form: FormGroup;
  submitAttempt: boolean = false;
  isSubmitting: boolean = false;
  showSearchTerm: string = '';
  searchText: string;
  paymentApproverFunction: Function;
  updatingPaymentApprover: boolean;
  newApproverSelected: boolean;
  isUnlimited: boolean = true;

  constructor(
    public userService: UserService,
    public navCtrl: NavController,
    public viewCtrl: ViewController,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    public events: Events,
    public formBuilder: FormBuilder,
    public modalCtrl: ModalController,
    public navParams: NavParams,
  ) {

  }

  ngOnInit() {
    if (this.navParams.data._approver) {
      this.approval = this.navParams.data;
    }
    this.form = this.formBuilder.group({
      _id: [''],
      _approver: ['', Validators.compose([Validators.required])],
      isUnlimited: [true, Validators.compose([Validators.required])],
      maxAmount: [''] });

    if (this.approval) {
      this.isUnlimited = this.approval.isUnlimited;
      this.form.patchValue({
        _approver: this.approval._approver,
        maxAmount: this.approval.maxAmount,
        isUnlimited: this.approval.isUnlimited });
    }
    this.paymentApproverFunction = this.updatePaymentApprover.bind(this);
  }

  goToSearchModal(selectFunction: Function, placeholderText: string) {
    this.updatingPaymentApprover = true;
    if (!this.approval || this.updatingPaymentApprover) {
      const params = {
        searchPlaceholder: placeholderText,
        serviceType: 'userService',
        selectFunction: selectFunction,
        role: 'payment approver',
      };
      this.updatingPaymentApprover = false;
      const searchModal = this.modalCtrl.create(this.searchPage, params);
      searchModal.present();
    }
  }

  updatePaymentApprover(user: string) {
    this.form.patchValue({
      _approver: user,
    });
  }

  toggleUnlimited() {
    this.isUnlimited = !this.isUnlimited;
  }

  goToConfirmation() {
    this.submitAttempt = true;
    if (this.form.valid && this.submitFunction && this.form.value._approver) {
      // If an approval exists, its ID to the form data
      if (this.approval) { this.form.patchValue({ _id: this.approval._id }); }

      const data = {
        form: this.form,
        submitFunction: this.submitFunction,
      };

      const paymentApprovalConfirmModal = this.modalCtrl.create(
        UserPaymentApprovalConfirmPage, data, { enableBackdropDismiss: false });
      paymentApprovalConfirmModal.present();
    }
  }
}
