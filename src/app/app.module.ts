import { NgModule, ErrorHandler } from '@angular/core';
import { IonicApp, IonicModule, IonicErrorHandler } from 'ionic-angular';
import { BrowserModule } from '@angular/platform-browser';
import { HttpModule } from '@angular/http';
import { IonicStorageModule } from '@ionic/storage';
import { Http } from '@angular/http';
import { AuthService } from '../pages/auth/auth.service';
import { MyApp } from './app.component';
import { NgCalendarModule } from 'ionic2-calendar';

import { InvoiceListPage } from '../pages/invoice/invoice-list/invoice-list.component';
import { InvoiceDetailPage } from '../pages/invoice/invoice-detail/invoice-detail.component';
import { InvoiceDraftCardPage } from '../pages/invoice/invoice-draft-card/invoice-draft-card.component';
import { InvoiceDraftDetailPage } from '../pages/invoice/invoice-draft-detail/invoice-draft-detail.component';
import { InvoiceEditPage } from '../pages/invoice/invoice-edit/invoice-edit.component';
import { CustomInvoiceNewPage } from '../pages/invoice/custom-invoice-new/custom-invoice-new.component';
import { CustomInvoiceConfirmPage } from '../pages/invoice/custom-invoice-confirm/custom-invoice-confirm.component';
import { InvoiceService } from '../pages/invoice/invoice.service';
import { InvoiceExportPage } from '../pages/invoice/invoice-export/invoice-export.component';

import { PaymentService } from '../pages/payment/payment.service';

import { HorseListPage } from '../pages/horse/horse-list/horse-list.component';
import { HorseDetailPage } from '../pages/horse/horse-detail/horse-detail.component';
import { HorseNewPage } from '../pages/horse/horse-new/horse-new.component';
import { HorseEditPage } from '../pages/horse/horse-edit/horse-edit.component';
import { HorseFormPage } from '../pages/horse/horse-form/horse-form.component';
import { HorseFilterPage } from '../pages/horse/horse-filter/horse-filter.component';
import { HorsePublicProfilePage } from '../pages/horse/horse-public-profile/horse-public-profile.component';
import { HorsePrivateNoteFormPage } from '../pages/horse/horse-private-note-form/horse-private-note-form.component';
import { HorseService } from '../pages/horse/horse.service';

import { ScheduleListPage } from '../pages/request/schedule-list/schedule-list.component';
import { ScheduleFilterPage } from '../pages/request/schedule-filter/schedule-filter.component';
import { RequestAssignPage } from '../pages/request/request-assign/request-assign.component';
import { RequestNewPage } from '../pages/request/request-new/request-new.component';
import { RequestEditPage } from '../pages/request/request-edit/request-edit.component';
import { RequestEditServicesPage } from '../pages/request/request-edit-services/request-edit-services.component';
import { RequestFormPage } from '../pages/request/request-form/request-form.component';
import { RequestConfirmPage } from '../pages/request/request-confirm/request-confirm.component';
import { RequestService } from '../pages/request/request.service';

import { UserEditPage } from '../pages/user/user-edit/user-edit.component';
import { UserProfilePage } from '../pages/user/user-profile/user-profile.component';
import { UserPublicProfilePage } from '../pages/user/user-public-profile/user-public-profile.component';
import { UserEditPaymentInfoPage } from '../pages/user/user-edit-payment-info/user-edit-payment-info.component';
import { UserChangePasswordPage } from '../pages/user/user-change-password/user-change-password.component';
import { UserChangeEmailPage } from '../pages/user/user-change-email/user-change-email.component';

import { UserNewPaymentApprovalPage } from '../pages/user/user-new-payment-approval/user-new-payment-approval.component';
import { UserEditPaymentApprovalPage } from '../pages/user/user-edit-payment-approval/user-edit-payment-approval.component';
import { UserPaymentApprovalFormPage } from '../pages/user/user-payment-approval-form/user-payment-approval-form.component';
import { UserPaymentApprovalConfirmPage } from '../pages/user/user-payment-approval-confirm/user-payment-approval-confirm.component';

import { UserNewServiceProviderPage } from '../pages/user/user-new-service-provider/user-new-service-provider.component';
import { UserServiceProviderFormPage } from '../pages/user/user-service-provider-form/user-service-provider-form.component';
import { UserServiceProviderConfirmPage } from '../pages/user/user-service-provider-confirm/user-service-provider-confirm.component';

import { TermsServicePage } from '../pages/legal/terms-service/terms-service.component';
import { PrivacyPolicyPage } from '../pages/legal/privacy-policy/privacy-policy.component';
import { LegalService } from '../pages/legal/legal.service';

import { ShowService } from '../pages/show/show.service';

import { NotificationListPage } from '../pages/notification/notification-list/notification-list.component';
import { NotificationService } from '../pages/notification/notification.service';

import { CameraUpload } from '../components/file-upload/camera-upload.component';
import { AvatarUploadItemComponent } from '../components/avatar-upload-item/avatar-upload-item.component';
import { AvatarHeaderLeftComponent } from '../components/avatar-header-left/avatar-header-left.component';
import { FileUploadService } from '../components/file-upload/file-upload.service';
import { ProgressBarComponent } from '../components/progress-bar/progress-bar.component';
import { Autocomplete } from '../components/autocomplete/autocomplete.component';
import { SearchPage } from '../components/search/search.component';
import { CalendarPage } from '../components/calendar/calendar.component';
import { StripeDropInComponent } from '../components/stripe-drop-in/stripe-drop-in.component';

import { TabsPage } from '../pages/tabs/tabs';
import { LoginPage } from '../pages/auth/login/login';
import { SignupPage } from '../pages/auth/signup/signup';
import { RolePage } from '../pages/auth/role/role';
import { AccountSetupManagerPage } from '../pages/auth/account-setup-manager/account-setup-manager';
import { AccountSetupProviderPage } from '../pages/auth/account-setup-provider/account-setup-provider';
import { ForgotPasswordPage } from '../pages/auth/forgot-password/forgot-password';
import { OnboardingPage } from '../pages/auth/onboarding/onboarding';
import { ControlErrorsComponent } from '../components/control-errors/control-errors.component';

import { EmailComposer } from '@ionic-native/email-composer';
import { ActionSheet } from '@ionic-native/action-sheet';
import { Camera } from '@ionic-native/camera';
import { Transfer } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';
import { Firebase } from '@ionic-native/firebase';
import { OneSignal } from '@ionic-native/onesignal';
import { InAppBrowser } from '@ionic-native/in-app-browser';
import { SocialSharing } from '@ionic-native/social-sharing';
import { CallNumber } from '@ionic-native/call-number';
import { SMS } from '@ionic-native/sms';
import { Network } from '@ionic-native/network';

import { UserService } from '../pages/user/user.service';
import { PushService } from '../components/push/push.service';
import { ValidationService } from '../components/control-errors/validation.service';
import { ExtendedHttpService } from '../providers/extended-http.service';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Keyboard } from '@ionic-native/keyboard';
import { TextMaskModule } from 'angular2-text-mask';
import { ElasticModule } from 'angular2-elastic';
import { ConstantsService } from '../providers/constants.service';
import { UtilityService } from '../providers/utility.service';
import { MomentModule } from 'angular2-moment';

@NgModule({
  declarations: [
    MyApp,
    InvoiceDraftDetailPage,
    InvoiceListPage,
    InvoiceDraftCardPage,
    InvoiceEditPage,
    InvoiceDetailPage,
    InvoiceExportPage,
    NotificationListPage,
    HorseListPage,
    HorseDetailPage,
    HorseNewPage,
    HorseEditPage,
    HorseFormPage,
    HorseFilterPage,
    RequestNewPage,
    RequestFormPage,
    RequestEditPage,
    RequestEditServicesPage,
    RequestConfirmPage,
    RequestAssignPage,
    ScheduleListPage,
    ScheduleFilterPage,
    UserProfilePage,
    UserEditPaymentInfoPage,
    UserNewPaymentApprovalPage,
    UserEditPaymentApprovalPage,
    UserPaymentApprovalFormPage,
    UserPaymentApprovalConfirmPage,
    UserNewServiceProviderPage,
    UserServiceProviderFormPage,
    UserServiceProviderConfirmPage,
    CustomInvoiceNewPage,
    CustomInvoiceConfirmPage,
    HorsePrivateNoteFormPage,
    UserEditPage,
    UserChangeEmailPage,
    UserChangePasswordPage,
    UserPublicProfilePage,
    HorsePublicProfilePage,
    CameraUpload,
    AvatarUploadItemComponent,
    AvatarHeaderLeftComponent,
    ProgressBarComponent,
    StripeDropInComponent,
    TermsServicePage,
    PrivacyPolicyPage,
    TabsPage,
    LoginPage,
    SignupPage,
    RolePage,
    AccountSetupManagerPage,
    AccountSetupProviderPage,
    ForgotPasswordPage,
    OnboardingPage,
    ControlErrorsComponent,
    Autocomplete,
    SearchPage,
    CalendarPage,
  ],
  imports: [
    IonicModule.forRoot(MyApp, {
      backButtonText: '',
    }),
    IonicStorageModule.forRoot(),
    BrowserModule,
    HttpModule,
    TextMaskModule,
    ElasticModule,
    MomentModule,
    NgCalendarModule,
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    InvoiceDraftDetailPage,
    InvoiceListPage,
    InvoiceDraftCardPage,
    InvoiceEditPage,
    InvoiceDetailPage,
    InvoiceExportPage,
    NotificationListPage,
    HorseListPage,
    HorseDetailPage,
    HorseNewPage,
    HorseEditPage,
    HorseFormPage,
    HorseFilterPage,
    HorsePublicProfilePage,
    RequestNewPage,
    RequestEditPage,
    RequestEditServicesPage,
    RequestFormPage,
    RequestConfirmPage,
    RequestAssignPage,
    ScheduleListPage,
    ScheduleFilterPage,
    TermsServicePage,
    PrivacyPolicyPage,
    UserProfilePage,
    UserEditPaymentInfoPage,
    UserNewPaymentApprovalPage,
    UserEditPaymentApprovalPage,
    UserPaymentApprovalFormPage,
    UserPaymentApprovalConfirmPage,
    UserNewServiceProviderPage,
    UserServiceProviderFormPage,
    UserServiceProviderConfirmPage,
    CustomInvoiceNewPage,
    CustomInvoiceConfirmPage,
    HorsePrivateNoteFormPage,
    UserEditPage,
    UserChangeEmailPage,
    UserChangePasswordPage,
    UserPublicProfilePage,
    TabsPage,
    LoginPage,
    SignupPage,
    RolePage,
    AccountSetupManagerPage,
    AccountSetupProviderPage,
    ForgotPasswordPage,
    OnboardingPage,
    CameraUpload,
    AvatarUploadItemComponent,
    AvatarHeaderLeftComponent,
    TabsPage,
    SearchPage,
    CalendarPage,
  ],
  providers: [
    OneSignal,
    InAppBrowser,
    ValidationService,
    PushService,
    StatusBar,
    SplashScreen,
    EmailComposer,
    ActionSheet,
    Camera,
    Firebase,
    Transfer,
    Keyboard,
    File,
    { provide: ErrorHandler, useClass: IonicErrorHandler },
    { provide: Http, useClass: ExtendedHttpService },
    ConstantsService,
    HorseService,
    FileUploadService,
    AuthService,
    UserService,
    RequestService,
    PaymentService,
    ShowService,
    NotificationService,
    SocialSharing,
    CallNumber,
    SMS,
    Network,
    LegalService,
    InvoiceService,
    UtilityService,
   ],
})
export class AppModule {}
