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

  constructor(private http: HttpClient, private router: Router) {}

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
