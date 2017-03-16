import { Component, ViewChild } from '@angular/core';
import { Platform, Nav, MenuController} from 'ionic-angular';
import { StatusBar, Splashscreen } from 'ionic-native';

//Pages
import { LoginPage } from '../pages/login/login';
import { HomePage } from '../pages/home/home';
import { AngularFire } from 'angularfire2';
import * as firebase from 'firebase';

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage = LoginPage;
  private pages: Array<{ title: string, icon: string, component: any }>
  private user: any;

  constructor(platform: Platform, public angularfire: AngularFire, public menuCtrl: MenuController) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();
    });

    // Set your sidemenu pages here.
    this.pages = [
      { title: 'Home', icon: 'md-home', component: HomePage }
    ];

    // Check if user is logged in and authenticated on Firebase.
    firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        // Set user information on the sidemenu based on userData created on database.
        this.angularfire.database.object('accounts/' + firebase.auth().currentUser.uid).subscribe((user) => {
          this.user = user;
        });
      }
    });
  }

  // Toggle menu.
  toggleMenu() {
    this.menuCtrl.toggle();
  }
  // Open page.
  openPage(page) {
    this.nav.setRoot(page.component);
  }
}
