import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Preferences } from '@capacitor/preferences';

import {
  BehaviorSubject,
  Observable,
  from,
  map,
  of,
  switchMap,
  take,
  tap,
} from 'rxjs';

import jwt_decode from 'jwt-decode';

import { NewUser } from '../models/newUser.model';
import { Role, User } from '../models/user.model';
import { environment } from 'src/environments/environment';
import { UserResponse } from './../models/userResponse.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private user$ = new BehaviorSubject<User | null>(null);

  private httpOptions: { headers: HttpHeaders } = {
    headers: new HttpHeaders({ 'Content-Type': 'application/json' }),
  };

  get userStream(): Observable<User | null> {
    return this.user$.asObservable();
  }

  get isUserLoggedIn(): Observable<boolean> {
    return this.user$.asObservable().pipe(
      switchMap((user: User | null) => {
        const isUserAuthenticated = user !== null;
        return of(isUserAuthenticated);
      })
    );
  }

  get userRole(): Observable<Role | undefined> {
    return this.user$.asObservable().pipe(
      switchMap((user: User | null) => {
        return of(user?.role);
      })
    );
  }

  get userId(): Observable<number | undefined> {
    return this.user$.asObservable().pipe(
      switchMap((user: User | null) => {
        return of(user?.id);
      })
    );
  }

  get userFullName(): Observable<string | null> {
    return this.user$.asObservable().pipe(
      switchMap((user: User | null) => {
        if (!user) {
          return of(null);
        }
        const fullName = user.firstName + ' ' + user.lastName;
        return of(fullName);
      })
    );
  }

  get userFullImagePath(): Observable<string> {
    return this.user$.asObservable().pipe(
      switchMap((user: User | null) => {
        const doesAuthorHasImage = !!user?.imagePath;
        let fullNamePath = this.getDefaultFullImagePath();

        if (doesAuthorHasImage) {
          fullNamePath = this.getFullImagePath(user.imagePath);
        }
        return of(fullNamePath);
      })
    );
  }

  constructor(private http: HttpClient, private router: Router) {}

  getDefaultFullImagePath(): string {
    return 'http://localhost:3000/api/feed/image/user-default.png';
  }

  getFullImagePath(imageName: string | undefined): string {
    return 'http://localhost:3000/api/feed/image/' + imageName;
  }

  getUserImage() {
    return this.http.get(`${environment.baseApiUrl}/user/image`).pipe(take(1));
  }

  getUserImageName(): Observable<{ imageName: string }> {
    return this.http
      .get<{ imageName: string }>(`${environment.baseApiUrl}/user/image-name`)
      .pipe(take(1));
  }

  updateUserImagePath(imagePath: string): Observable<User | null> {
    return this.user$.pipe(
      take(1),
      map((user: User | null) => {
        if (user === null) {
          return null;
        }

        user.imagePath = imagePath;
        this.user$.next(user);
        return user;
      })
    );
  }

  uploadUserImage(
    formData: FormData
  ): Observable<{ modifiedFileName: string }> {
    return this.http
      .post<{ modifiedFileName: string }>(
        `${environment.baseApiUrl}/user/upload`,
        formData
      )
      .pipe(
        tap(({ modifiedFileName }) => {
          let user = this.user$.value;
          user!.imagePath = modifiedFileName;
          this.user$.next(user);
        })
      );
  }

  register(newUser: NewUser): Observable<User> {
    return this.http
      .post<User>(
        `${environment.baseApiUrl}/auth/register`,
        newUser,
        this.httpOptions
      )
      .pipe(take(1));
  }

  login(email: string, password: string): Observable<{ token: string }> {
    return this.http
      .post<{ token: string }>(
        `${environment.baseApiUrl}/auth/login`,
        { email, password },
        this.httpOptions
      )
      .pipe(
        take(1),
        tap((res: { token: string }) => {
          Preferences.set({ key: 'token', value: res.token });
          const decodedToken: UserResponse = jwt_decode(res.token);
          this.user$.next(decodedToken.user);
        })
      );
  }

  isTokenInStorage(): Observable<boolean> {
    return from(Preferences.get({ key: 'token' })).pipe(
      map((data: { value: string | null }) => {
        if (!data || !data.value) {
          return false;
        }

        const decodedToken: UserResponse = jwt_decode(data.value);
        const jwtExpirationInMsSinceUnixEpoch = decodedToken.exp * 1000;
        const isExpired =
          new Date() > new Date(jwtExpirationInMsSinceUnixEpoch);

        if (isExpired) {
          return false;
        }

        if (decodedToken.user) {
          this.user$.next(decodedToken.user);
          return true;
        }

        return false;
      })
    );
  }

  logout(): void {
    this.user$.next(null);
    Preferences.remove({ key: 'token' });
    this.router.navigateByUrl('/auth');
  }
}
