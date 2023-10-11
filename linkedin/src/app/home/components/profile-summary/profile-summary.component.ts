import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';

import { BehaviorSubject, Subscription, from, of } from 'rxjs';
import { switchMap, take } from 'rxjs/operators';

import { AuthService } from 'src/app/auth/services/auth.service';
import { Role } from 'src/app/auth/models/user.model';
// import { FileTypeResult, fileTypeFromBuffer } from 'file-type';

type validFileExtension = 'png' | 'jpg' | 'jpeg';
type validMimeType = 'image/png' | 'image/jpg' | 'image/jpeg';

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
export class ProfileSummaryComponent implements OnInit, OnDestroy {
  form!: FormGroup;

  validFileExtensions: validFileExtension[] = ['png', 'jpg', 'jpeg'];
  validMimeTypes: validMimeType[] = ['image/png', 'image/jpg', 'image/jpeg'];

  userFullImagePath!: string;
  private userImagePathSubscription!: Subscription;

  fullName$ = new BehaviorSubject<string | null>(null);
  fullName = '';

  bannerColors: BannerColors = {
    colorOne: '#ab04b7',
    colorTwo: '#dbe7e9',
    colorThree: '#bfd3d6',
  };

  constructor(private authService: AuthService) {}

  ngOnInit() {
    this.form = new FormGroup({
      file: new FormControl(null),
    });

    this.authService.userRole
      .pipe(take(1))
      .subscribe((role: Role | undefined) => {
        if (role !== undefined) {
          this.bannerColors = this.getBannerColors(role);
        } else {
          // Handle the case when the role is undefined, if needed.
        }
      });

    this.authService.userFullName
      .pipe(take(1))
      .subscribe((fullName: string) => {
        this.fullName = fullName;
        this.fullName$.next(fullName);
      });

    this.userImagePathSubscription =
      this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
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

  // onFileSelect(e: Event): void {
  //   const inputElement = e.target as HTMLInputElement | null;

  //   if (!inputElement) {
  //     return;
  //   }

  //   const file: File | null = inputElement.files![0] || null;

  //   if (!file) {
  //     return;
  //   }

  //   const fromData = new FormData();
  //   fromData.append('file', file);

  //   from(file.arrayBuffer())
  //     .pipe(
  //       switchMap((arrayBuffer: ArrayBuffer) => {
  //         // Convert ArrayBuffer to Buffer
  //         const buffer = Buffer.from(arrayBuffer);

  //         return from(fileTypeFromBuffer(buffer)).pipe(
  //           switchMap((fileTypeResult: FileTypeResult | undefined) => {
  //             if (!fileTypeResult) {
  //               console.log({ error: 'file format not supported' });
  //               return of();
  //             }

  //             const { ext, mime } = fileTypeResult;
  //             const isFileTypeLegit = this.validFileExtensions.includes(
  //               ext as any
  //             );
  //             const isMimeTypeLegit = this.validMimeTypes.includes(mime as any);
  //             const isFileLegit = isFileTypeLegit && isMimeTypeLegit;

  //             if (!isFileLegit) {
  //               console.log({
  //                 error: 'file format does not match file extension',
  //               });
  //               return of();
  //             }

  //             return this.autService.uploadUserImage(fromData);
  //           })
  //         );
  //       })
  //     )
  //     .subscribe();

  //   this.form.reset();
  // }

  onFileSelect(e: Event): void {
    const inputElement = e.target as HTMLInputElement | null;

    if (!inputElement) {
      return;
    }

    const file: File | null = inputElement.files![0] || null;

    if (!file) {
      return;
    }

    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    const fileType = file.type;

    if (
      fileExtension &&
      this.validFileExtensions.includes(fileExtension as validFileExtension) &&
      this.validMimeTypes.includes(fileType as validMimeType)
    ) {
      const fromData = new FormData();
      fromData.append('file', file);

      this.authService.uploadUserImage(fromData).subscribe();
    } else {
      console.log({
        error: 'Invalid file format or file extension',
      });
    }

    this.form.reset();
  }

  ngOnDestroy(): void {
    this.userImagePathSubscription.unsubscribe();
  }
}
