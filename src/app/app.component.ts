import { Component } from '@angular/core';
import { Platform } from 'ionic-angular';
import { StatusBar } from '@ionic-native/status-bar';
import { Keyboard } from '@ionic-native/keyboard';
import { SplashScreen } from '@ionic-native/splash-screen';
import { Storage } from '@ionic/storage';
import { ModalController, Events } from 'ionic-angular';
import { LoginPage } from '../pages/auth/login/login';
import { RolePage } from '../pages/auth/role/role';
import { OnboardingPage } from '../pages/auth/onboarding/onboarding';
import { TabsPage } from '../pages/tabs/tabs';
import { PushService } from '../components/push/push.service';
import { AuthService } from '../pages/auth/auth.service';

@Component({
  templateUrl: 'app.html',
})
export class MyApp {
  rootPage: any = TabsPage;

  constructor(
    public storage: Storage,
    public platform: Platform,
    public statusBar: StatusBar,
    public keyboard: Keyboard,
    public splashScreen: SplashScreen,
    public modalCtrl: ModalController,
    public events: Events,
    public pushService: PushService,
    public authService: AuthService,
  ) {

    // Make sure back button exits the app
    this.platform.registerBackButtonAction(() => {
      this.platform.exitApp();
    });

    this.storage.get('token')
      .then((token) => {
        if (!token) {
          this.checkOnboardingStatus();
        } else {
          // Get current user and check account status
          this.authService.getCurrentUser()
            .then((response) => {
              this.authService.currentUser = response;

              if (!this.authService.currentUser.accountSetupComplete) {
                const roleModal = this.modalCtrl.create(RolePage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
                roleModal.present();
              }
            });
        }

        this.platformReady();
      });

    this.listenToLogoutEvents();
  }

  checkOnboardingStatus() {
    this.storage.get('hasSeenOnboarding')
      .then((hasSeenOnboarding) => {
        if (!hasSeenOnboarding) {
          const onboardingModal = this.modalCtrl.create(
            OnboardingPage,
            null,
            { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' },
          );

          onboardingModal.present();
        } else {
          const loginModal = this.modalCtrl.create(LoginPage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
          loginModal.present();
        }
      });
  }

  platformReady() {
    this.platform.ready()
      .then(() => {
        // Okay, so the platform is ready and our plugins are available.
        // Here you can do any higher level native things you might need.
        this.statusBar.styleDefault();
        this.splashScreen.hide();
        this.statusBar.styleLightContent();
        this.keyboard.disableScroll(true);
        this.keyboard.hideKeyboardAccessoryBar(false);
        this.pushService.initOneSignal();
      });
  }

  listenToLogoutEvents() {
    this.events.subscribe('user:logged-out', () => {
      const loginModal = this.modalCtrl.create(LoginPage, null, { enableBackdropDismiss: false, cssClass: 'opaque-backdrop' });
      loginModal.present();
    });
  }

}
