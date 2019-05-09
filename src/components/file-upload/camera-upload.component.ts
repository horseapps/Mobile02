import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { ActionSheet, ActionSheetOptions } from '@ionic-native/action-sheet';
import { Camera, CameraOptions } from '@ionic-native/camera';
import { FileObject } from './file-object';
import { FileUploadService } from './file-upload.service';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'camera-upload',
  templateUrl: 'camera-upload.html',
})

export class CameraUpload implements OnInit, OnDestroy {
  progressSubscription: Subscription;
  statusSubscription: Subscription;
  @Input() forFile: any; // Bind a single file to the parent component (e.g., user avatar)
  @Output() forFileChange: EventEmitter<any> = new EventEmitter();
  @Input() isUploading: boolean; // Bind an uploadingFile boolean to the parent component
  @Output() isUploadingChange: EventEmitter<any> = new EventEmitter();
  @Input() saveToPhotoAlbum: boolean; // Save to the user's photo album, default false
  @Input() allowEdit: boolean; // All the user to edit their photo after taking it, default true
  @Input() targetWidth: number; // Max width of the photo and still keep proportions, default 640
  @Input() targetHeight: number; // Max height of the photo and still keep proportions, default 640
  @Input() quality: number; // 50 to 100 integer for the image quality, default 100
  @Input() useTemplate: boolean; // Use the included camera upload template file if true
  @Input() fileUri: string; // Bind file uri to the parent component
  @Output() fileUriChange: EventEmitter<any> = new EventEmitter();
  @Input() fileStatus: number; // Bind file status to the parent component
  @Output() fileStatusChange: EventEmitter<any> = new EventEmitter();
  @Input() fileProgress: number; // Bind file progress to the parent component
  @Output() fileProgressChange: EventEmitter<any> = new EventEmitter();

  constructor(
    private fileUploadService: FileUploadService,
    private actionSheet: ActionSheet,
    private camera: Camera,
  ) { }

  ngOnInit() {
    // Clear out previously uploaded files
    this.fileUploadService.files = [];

    // Subscribe to the fileProgress observable
    this.progressSubscription = this.fileUploadService.fileProgress$
     .subscribe((progress) => {
       // Update fileProgress variable bound to parent component
       this.fileProgressChange.emit(progress);
     });

     // Subscribe to the fileStatus observable
    this.statusSubscription = this.fileUploadService.fileStatus$
     .subscribe((status) => {
       // Update fileStatus variable bound to parent component
       this.fileStatusChange.emit(status);
     });
  }

  ngOnDestroy() {
    // Unsubscribe and clear out fileProgress
    this.fileUploadService._fileProgressSource.next(null);
    this.fileUploadService._fileStatusSource.next(null);
    this.progressSubscription.unsubscribe();
    this.statusSubscription.unsubscribe();
  }

  openActionSheet(event: any): void {
    event.preventDefault();

    const options: ActionSheetOptions = {
      buttonLabels: ['Take New Photo', 'Choose Photo From Library'],
      addCancelButtonWithLabel: 'Cancel',
      androidEnableCancelButton: true,
      winphoneEnableCancelButton: true,
    };

    this.actionSheet.show(options)
    .then((buttonIndex: number) => {
      let cameraOptions: CameraOptions = {
        destinationType: this.camera.DestinationType.DATA_URL,
        sourceType: this.camera.PictureSourceType.CAMERA,
        quality: this.quality || 100,
        targetWidth: this.targetWidth || 640,
        targetHeight: this.targetHeight || 640,
        saveToPhotoAlbum: this.saveToPhotoAlbum, // Will default to false
        allowEdit: (this.allowEdit === false ? false : true), // Must be explicitly set to false in html
      };

      if (buttonIndex === 1) {
        cameraOptions.sourceType = this.camera.PictureSourceType.CAMERA;
        this.choosePhoto(cameraOptions);
      } else if (buttonIndex === 2) {
        cameraOptions.sourceType = this.camera.PictureSourceType.PHOTOLIBRARY;
        this.choosePhoto(cameraOptions);
      }
    });
  }

  choosePhoto(options: CameraOptions): void {
    this.camera.getPicture(options)
    .then((imageData) => {
        let fileObject = new FileObject();

        fileObject.data = 'data:image/png;base64,' + imageData;
        fileObject.name = 'file';
        fileObject.type = 'image/jpg';

        this.fileUploadService.files = [fileObject];

        // Update fileUri variable
        this.fileUriChange.emit(fileObject.data);

        // Update isUploading variable
        this.isUploadingChange.emit(true);

        // Update fileStatus variable
        this.fileStatusChange.emit(this.fileUploadService.statuses.UPLOADING);

        // Upload the file to our server/AWS
        this.fileUploadService.uploadFile(fileObject)
          .then((result) => {

            // Update forFile
            this.forFileChange.emit(result);

            // Update fileStatus variable
            this.fileStatusChange.emit(this.fileUploadService.statuses.UPLOADED);

            // Update isUploading variable
            this.isUploadingChange.emit(false);
          });
      })
      .catch((error) => {
        // Update isUploading variable
        this.isUploadingChange.emit(false);
        console.error(error);
      });
  }
}
