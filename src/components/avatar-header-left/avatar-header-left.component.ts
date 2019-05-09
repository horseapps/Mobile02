import { Component, Input } from '@angular/core';
import { ConstantsService } from '../../providers/constants.service';

@Component({
  selector: 'avatar-header-left',
  templateUrl: 'avatar-header-left.html',
})
export class AvatarHeaderLeftComponent {
  @Input() object: any;
  @Input() type: string;

  constructor(
    public constants: ConstantsService,
  ) {}
}
