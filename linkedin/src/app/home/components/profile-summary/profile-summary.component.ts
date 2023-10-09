import { Component, OnInit } from '@angular/core';

import { take } from 'rxjs/operators';

import { AuthService } from 'src/app/auth/services/auth.service';
import { Role } from 'src/app/auth/models/user.model';

type BannerColors = {
  colorOne: string;
  colorTwo: string;
  colorThree: string;
};

@Component({
  selector: 'app-profile-summary',
  templateUrl: './profile-summary.component.html',
  styleUrls: ['./profile-summary.component.scss'],
})
export class ProfileSummaryComponent implements OnInit {
  bannerColors: BannerColors = {
    colorOne: '#ab04b7',
    colorTwo: '#dbe7e9',
    colorThree: '#bfd3d6',
  };

  constructor(private autService: AuthService) {}

  ngOnInit() {
    this.autService.userRole
      .pipe(take(1))
      .subscribe((role: Role | undefined) => {
        if (role !== undefined) {
          this.bannerColors = this.getBannerColors(role);
        } else {
          // Handle the case when the role is undefined, if needed.
        }
      });
  }

  private getBannerColors(role: Role): BannerColors {
    switch (role) {
      case 'admin':
        return {
          colorOne: '#daa520',
          colorTwo: '#f0e68c',
          colorThree: '#fafad2',
        };

      case 'premium':
        return {
          colorOne: '#bc8f8f',
          colorTwo: '#c09999',
          colorThree: '#ddadaf',
        };

      default:
        return this.bannerColors;
    }
  }
}
