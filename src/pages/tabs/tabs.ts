import { Component, ViewChild } from '@angular/core';
import { Events } from 'ionic-angular';
import { InvoiceListPage } from '../invoice/invoice-list/invoice-list.component';
import { HorseListPage } from '../horse/horse-list/horse-list.component';
import { ScheduleListPage } from '../request/schedule-list/schedule-list.component';
import { UserProfilePage } from '../user/user-profile/user-profile.component';
import { AuthService } from '../auth/auth.service';
import { PushService } from '../../components/push/push.service';

@Component({
  templateUrl: 'tabs.html',
})
export class TabsPage {
  @ViewChild('myTabs') tabRef: any;
  // this tells the tabs component which Pages
  // should be each tab's root Page
  tab1Root: any = HorseListPage;
  tab2Root: any = ScheduleListPage;
  tab3Root: any = InvoiceListPage;
  tab4Root: any = UserProfilePage;

  constructor(
    public authService: AuthService,
    private events: Events,
    public pushService: PushService,
  ) {

    this.events.subscribe('user:logged-in', () => {
      this.setSelectedTab();
      this.pushService.addDevice();
    });

    this.events.subscribe('user:account-setup-complete', () => {
      this.setSelectedTab();
    });
  }

  /**
   * Set the selected tab based on user role
   */
  setSelectedTab() {
    if (this.authService.currentUser) {
      if (this.authService.isManager()) {
        this.tabRef.select(0);
      } else if (this.authService.isServiceProvider()) {
        this.tabRef.select(1);
      }
    }
  }
}
