import { Component, OnInit } from '@angular/core';
import { ViewController, NavParams } from 'ionic-angular';
import { Notification } from '../notification';
import { NotificationService } from '../notification.service';
import { ConstantsService } from '../../../providers/constants.service';

@Component({
  selector: 'page-notification-list',
  templateUrl: 'notification-list.html',
})

export class NotificationListPage implements OnInit {
  notifications: Notification[] = [];
  currentPage: number;
  itemsPerPage: number;
  canLoadMore: boolean;
  isLoading: boolean;
  isRefreshing: boolean;

  constructor(
    public viewCtrl: ViewController,
    public navParams: NavParams,
    public constants: ConstantsService,
    public notificationService: NotificationService,
  ) {
    this.currentPage = 0;
    this.itemsPerPage = 20;
    this.canLoadMore = true;
  }

  ngOnInit() {
    this.findAll();
  }

  /**
   * Retrieves items and item count and manages infinite scroll for lists
   * @param  {$event} InfiniteScroll The optional infiniteScroll event
   * @param  {$event} Refresher The optional refresher event
   */
  findAll(infiniteScroll?: any, refresher?: any): void {
    this.isLoading = true;
    let skip = this.itemsPerPage * this.currentPage;

    this.notificationService.query({ limit: this.itemsPerPage, skip: skip })
      .then((response) => {
        this.currentPage += 1;

        // Once the number of items returned is less than items per page it's time to stop
        if (response.length < this.itemsPerPage) {
          this.canLoadMore = false;
        }

        // Concat the response to our model list data
        this.notifications = this.notifications.concat(response);

        // Stop the infiniteScroll and refresher when complete
        if (infiniteScroll) { infiniteScroll.complete(); }
        if (refresher) { refresher.complete(); }
        this.isLoading = false;
      })
      .catch((error) => {
        this.canLoadMore = false;
        const message = error.json().message || 'There was an error.';
        this.notificationService.handleError(message);
      });
  }

  /**
   * Refresh list by setting variables back to our blank state
   * @param  {$event} Refresher The refresher event
   */
  refreshList(refresher: any) {
    this.isRefreshing = true;
    this.canLoadMore = true;
    this.currentPage = 0;
    this.notifications = [];
    this.findAll(refresher);
  }

}
