import { Component, Input, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { ModalController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/auth/services/auth.service';

@Component({
  selector: 'app-modal',
  templateUrl: './modal.component.html',
  styleUrls: ['./modal.component.scss'],
})
export class ModalComponent implements OnInit, OnDestroy {
  @ViewChild('form')
  form!: NgForm;

  @Input() postId?: number;

  constructor(
    public modalController: ModalController,
    private authService: AuthService
  ) {}

  userFullImagePath!: string;
  private userImagePathSubscription!: Subscription;

  ngOnInit() {
    this.userImagePathSubscription =
      this.authService.userFullImagePath.subscribe((fullImagePath: string) => {
        this.userFullImagePath = fullImagePath;
      });
  }

  onDismiss() {
    this.modalController.dismiss(null, 'dismiss');
  }

  onPost() {
    if (!this.form.valid) {
      return;
    }
    const body = this.form.value['body'];
    this.modalController.dismiss(
      {
        post: {
          body,
        },
      },
      'post'
    );
  }

  ngOnDestroy(): void {
    this.userImagePathSubscription.unsubscribe();
  }
}
