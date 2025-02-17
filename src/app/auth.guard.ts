import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, RouterLink } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from './services/auth.service';


@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean> | Promise<boolean> | boolean {

    if (this.authService.isLoggedIn()) {
      return true; 
    }

    this.router.navigate(['/prijava']);
    return false;
  }
}
