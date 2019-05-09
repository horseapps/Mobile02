import { Component } from '@angular/core';
import { ModalController, ViewController, ToastController, NavController } from 'ionic-angular';

import { AccountSetupManagerPage } from '../account-setup-manager/account-setup-manager';
import { AccountSetupProviderPage } from '../account-setup-provider/account-setup-provider';

import { AuthService } from '../auth.service';
import { UserService } from '../../user/user.service';
import { ValidationService } from '../../../components/control-errors/validation.service';

@Component({
  selector: 'page-role',
  templateUrl: 'role.html',
})

export class RolePage {
  role: string;

  constructor(
    private modalCtrl: ModalController,
    private viewCtrl: ViewController,
    private navCtrl: NavController,
    private toastCtrl: ToastController,
    private authService: AuthService,
    private userService: UserService,
    private validationService: ValidationService,
  ) {}

  setRole(role: string) {
    this.role = role;

    let view;

    if (role === 'horse manager') {
      view = AccountSetupManagerPage;
    } else if (role === 'service provider') {
      view = AccountSetupProviderPage;
    }

    // Send the viewCtrl as a nav param so we can dismiss view after account creation
    this.navCtrl.push(view, { role: role, viewCtrl: this.viewCtrl });
  }
}
