import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, RouterModule } from '@angular/router';


@Component({
  selector: 'app-prijava',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './prijava.component.html',
  styleUrl: './prijava.component.css'
})
export class PrijavaComponent {
  user: any = {username: '', password: '', email: '', name: ''};
  isLogin = true;
  

  constructor(private auth: AuthService, private router: Router) { }

  ngOnInit() {
  }

  onSubmit() {
    if (this.isLogin) {
      const userData = {
        username: this.user.username,
        password: this.user.password,
        name: this.user.name,
        email: this.user.email,
        role: ''
      };
      this.auth.login(userData).subscribe(
        (res :any) => {
        
        console.log('✅ Prijava uspješna:', res);
        this.auth.saveToken(res.token); 
        this.router.navigate(['/']);
      },
      (err: any) => {
        console.log('❌ Greška pri prijavi:', err);
        alert('Neispravan username ili password!');
      });
    } else {
      const userData = {
        username: this.user.username,
        password: this.user.password,
        name: this.user.name,
        email: this.user.email,
        role: 'user'
      };
      this.auth.register(userData).subscribe(
        (res: any) => {
        console.log('✅ Registracija uspješna:', res);
        this.auth.saveToken(res.token);
        this.toggleMode();
        this.router.navigate(['prijava']);
      },
      (err: any) => {
        console.log('❌ Greška pri registraciji:', err);
        alert('Neispravni podaci!');
      }
      )
    }
  }

  admin(){
    this.router.navigate(['admin']);
  }

  toggleMode(){
    this.isLogin = !this.isLogin;
  }
}
