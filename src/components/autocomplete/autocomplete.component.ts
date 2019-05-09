import { Component, NgZone, Input, AfterViewInit } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { ToastController } from 'ionic-angular';

@Component({
  selector: 'autocomplete',
  templateUrl: 'autocomplete.html',
})

export class Autocomplete implements AfterViewInit {
  autocompleteItems: any;
  autocomplete: any;
  autocompleteService: any;
  @Input() form: any; // Bind to the form in the parent component
  focus: boolean = false;

  constructor (
    private formBuilder: FormBuilder,
    private zone: NgZone,
    private toastCtrl: ToastController,
  ) {
    this.autocompleteItems = [];
    this.autocomplete = {
      query: '',
    };
  }

  ngAfterViewInit() {
    this.loadGoogleMaps()
      .then(() => {
        this.autocompleteService = new google.maps.places.AutocompleteService();
      })
      .catch((error) => {
        const message = error.json().message || 'There was an error.';
        const toast = this.toastCtrl.create({
          cssClass: 'toast-danger',
          message: message,
          duration: 3000,
          position: 'bottom',
          showCloseButton: true,
        });
        toast.present();
      });
  }

  loadGoogleMaps(): Promise<void> {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDlIfxdHeoBsoZz0S9Vp-hj6Y_VnR5EDbY&libraries=places';
      script.onload = () => resolve();
      script.onerror = () => reject(new URIError('Google Maps did not load correctly'));
      document.head.appendChild(script);
    });
  }

  chooseItem(item: any) {
    // Update location
    this.form.patchValue({ location: item });

    // Clear search bar and results
    this.autocompleteItems = [];
    this.autocomplete = {
      query: '',
    };
  }

  updateSearch() {
    if (this.autocomplete.query === '') {
      this.autocompleteItems = [];
      return;
    }

    let _this = this;

    this.autocompleteService.getPlacePredictions({ input: this.autocomplete.query }, (predictions, status) => {
      _this.autocompleteItems = [];
      _this.zone.run(() => {
        if (predictions && predictions.length) {
          predictions.forEach((prediction) => {
            _this.autocompleteItems.push(prediction.description);
          });
        }
      });
    });
  }
}
