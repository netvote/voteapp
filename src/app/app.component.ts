import { Component, ViewChild } from '@angular/core';
import {Platform, Nav, MenuController, AlertController} from 'ionic-angular';
import { StatusBar, Splashscreen, Deeplinks } from 'ionic-native';

//Pages
import { LoginPage } from '../pages/login/login';
import { ManageBallotsPage } from '../pages/manage-ballots/manage-ballots'
import { HomePage } from '../pages/home/home';
import { AngularFire } from 'angularfire2';
import * as firebase from 'firebase';
import {LogoutProvider} from "../providers/logout";
import {VoterBallotsPage} from "../pages/voter-ballots/voter-ballots";

@Component({
  templateUrl: 'app.html'
})
export class MyApp {
  @ViewChild(Nav) nav: Nav;
  rootPage = LoginPage;
  private pages: Array<{ title: string, icon: string, component: any }>
  private user: any;

  constructor(platform: Platform, public angularfire: AngularFire, public menuCtrl: MenuController, public alertCtrl: AlertController, public logoutProvider: LogoutProvider) {
    platform.ready().then(() => {
      // Okay, so the platform is ready and our plugins are available.
      // Here you can do any higher level native things you might need.
      StatusBar.styleDefault();
      Splashscreen.hide();

      Deeplinks.route({
        '/:ballotId': VoterBallotsPage
      }).subscribe((match) => {
        let ballotId = match.$link.path.substring(1);
        if(this.nav != undefined) {
          this.nav.setRoot(VoterBallotsPage, {"ballotId": ballotId});
        }else{
          console.error("this.nav is undefined!")
        }
      }, (nomatch) => {
        console.error('Got a deeplink that didn\'t match: '+nomatch.$link);
      });

    });

    // Set your sidemenu pages here.
    this.pages = [
      { title: 'Manage Elections', icon: 'color-wand', component: ManageBallotsPage},
      { title: 'Voting', icon: 'checkmark-circle', component: VoterBallotsPage}
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

  ngOnInit() {

  }


  // Toggle menu.
  toggleMenu() {
    this.menuCtrl.toggle();
  }

  openProfile() {
    this.nav.setRoot(HomePage)
  }

  // Open page.
  openPage(page) {
    this.nav.setRoot(page.component);
  }

  logout() {
    this.alertCtrl.create({
      title: 'Confirm Logout',
      message: 'Are you sure you want to logout?',
      buttons: [
        {
          text: 'Cancel'
        },
        {
          text: 'Logout',
          handler: data => { this.logoutProvider.logout(); }
        }
      ]
    }).present();
  }

}
