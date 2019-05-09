import { Component, Input } from '@angular/core';
import { ViewController, ModalController } from 'ionic-angular';
import { InvoiceDraftDetailPage } from '../invoice-draft-detail/invoice-draft-detail.component';
import { AuthService } from '../../auth/auth.service';
import { HorseService } from '../../horse/horse.service';

@Component({
  selector: 'page-invoice-draft-card',
  templateUrl: 'invoice-draft-card.html',
})

export class InvoiceDraftCardPage {
  @Input() groupedRequests: any[];

  constructor(
    public authService: AuthService,
    public horseService: HorseService,
    public viewCtrl: ViewController,
    public modalCtrl: ModalController,
  ) {}

  goToDraftDetail(horseGroup: any) {
    const params = {
      requestGroup: horseGroup,
    };

    const draftDetailModal = this.modalCtrl.create(InvoiceDraftDetailPage, params);
    draftDetailModal.present();
  }
}
