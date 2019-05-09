import { Injectable, ApplicationRef } from '@angular/core';
import { Http } from '@angular/http';
import { Transfer, FileUploadOptions, TransferObject } from '@ionic-native/transfer';
import { File } from '@ionic-native/file';
import { FileObject } from './file-object';
import { ConstantsService } from '../../providers/constants.service';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/toPromise';

@Injectable()
export class FileUploadService {
  files: any[] = [];
  statuses: { ERROR: string, UPLOADING: string, UPLOADED: string, PROCESSING: string };

  // Observable progress source
  public _fileProgressSource: any = new BehaviorSubject<number>(null);
  // Observable status source
  public _fileStatusSource: any = new BehaviorSubject<string>(null);

  // Observable progress stream
  fileProgress$: any = this._fileProgressSource.asObservable();
  // Observable status stream
  fileStatus$: any = this._fileStatusSource.asObservable();

  constructor(
    public constants: ConstantsService,
    private http: Http,
    private transfer: Transfer,
    private file: File,
    private ref: ApplicationRef,
  ) {

    this.statuses = {
      ERROR: 'error',
      UPLOADING: 'uploading',
      UPLOADED: 'uploaded',
      PROCESSING: 'processing',
    };
  }

  /**
   * Send a single file to our server to be uploaded to AWS
   * @param  {Object} file  The file object to be uploaded
   * @return {Nothing}      No return
   */
  uploadFile(file: FileObject): Promise<void> {
    file.status = this.statuses.PROCESSING;

    const httpUrl: string = `${this.constants.API_BASE_URL}/aws/uploadToAws`;
    const fileTransfer: TransferObject = this.transfer.create();

    const options: FileUploadOptions = {
     fileKey: file.name,
     fileName: file.name,
     chunkedMode: false,
     mimeType: file.type !== '' ? file.type : 'application/octet-stream',
    };

    // Update the progress and status of the image upload
    let onProgress = (progressEvent: ProgressEvent) : void => {
      file.status = this.statuses.PROCESSING;

      if (progressEvent.lengthComputable) {
        file.status = this.statuses.PROCESSING;

        // Update the fileStatus obsverable
        this._fileStatusSource.next(file.status);

        // Set progress as it comes back from the event
        file.progress = Math.round((progressEvent.loaded / progressEvent.total) * 100);

        // Update the fileProgress obsverable
        this._fileProgressSource.next(file.progress);

        // Detect changes so the progress bar updates with the onProgress event
        this.ref.tick();
      }
     };

    fileTransfer.onProgress(onProgress);

    // Upload image to our server
    return fileTransfer.upload(file.data, encodeURI(httpUrl), options, true)
      .then((result) => {
        if (result.responseCode === 204 || result.responseCode === 200) {
          file.status = this.statuses.UPLOADED;

          // Update the fileStatus obsverable
          this._fileStatusSource.next(file.status);

          // Create the file object to store meta data on our server
          let fileObject = JSON.parse(result.response);
          return fileObject;
        } else {
          file.status = this.statuses.ERROR;

          // Update the fileStatus obsverable
          this._fileStatusSource.next(file.status);

          return { error: 'There was an error with the upload.' };
        }
      }, (err: any) => {
        file.status = this.statuses.ERROR;

        // Update the fileStatus obsverable
        this._fileStatusSource.next(file.status);

        return err;
      });
  }
}
