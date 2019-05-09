import { Component, Input } from '@angular/core';
import { ConstantsService } from '../../providers/constants.service';
import { AuthService } from '../../pages/auth/auth.service';
import { HorseService } from '../../pages/horse/horse.service';

@Component({
  selector: 'avatar-upload-item',
  templateUrl: 'avatar-upload-item.html',
})
export class AvatarUploadItemComponent {
  @Input() forObject: any;
  isUploading: boolean = false;
  fileUri: string;
  fileStatus: string;
  fileProgress: number;

  constructor(
    private authService: AuthService,
    private horseService: HorseService,
    public constants: ConstantsService,
  ) {}
}
