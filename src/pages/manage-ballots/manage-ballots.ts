import { Component } from '@angular/core';
import {NavController, NavParams, MenuController, ActionSheetController} from 'ionic-angular';
import {AngularFire} from "angularfire2";
import * as firebase from 'firebase';

/*
  Generated class for the ManageBallots page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-manage-ballots',
  templateUrl: 'manage-ballots.html'
})
export class ManageBallotsPage {

  private ballots: any = [];
  private userId: string;
  private loading: boolean = true;

  constructor(public navCtrl: NavController, public navParams: NavParams, public actionSheetCtrl: ActionSheetController,
              public angularfire: AngularFire, public menuCtrl: MenuController) {}




  ionViewDidLoad() {
    this.menuCtrl.enable(true);
    this.menuCtrl.swipeEnable(true);
    this.menuCtrl.close();

    let userId = firebase.auth().currentUser.uid;

    this.userId = userId;

    let ballotsRef = firebase.database().ref('/ballot-config-lists/' + userId).orderByKey();

    ballotsRef.once("value").then((ballots) =>{
      let tmpBallots = []
      ballots.forEach((ballot) => {
        console.log(JSON.stringify(ballot))
        tmpBallots.push(this.toUIBallot(ballot))
      });
      this.ballots = tmpBallots;
      this.loading = false;
    });

    ballotsRef.on('child_added', (b) => {
      this.ballots.push(this.toUIBallot(b))
    });

    ballotsRef.on('child_changed',(b) => {
      for(let i=0; i<this.ballots.length; i++){
        if(this.ballots[i].key == b.key){
          this.ballots[i] = this.toUIBallot(b)
          return;
        }
      }
    });

    ballotsRef.on('child_removed', (b) => {
      for(let i=0; i<this.ballots.length; i++){
        if(this.ballots[i].key == b.key){
          this.ballots.splice( i, 1 )
          return;
        }
      }
    });

  }

  // Toggle sidebar
  toggleMenu() {
    this.menuCtrl.toggle();
  }

  addBallot(){
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Ballot Options',
      buttons: [
        {
          text: 'One-Time',
          handler: () => {
            this.createBallot(this.getMockBallot(false))
          }
        },{
          text: 'One-Time 2FA',
          handler: () => {
            this.createBallot(this.getMockBallot(true))
          }
        },{
          text: 'Repeatable',
          handler: () => {
            this.createBallot(this.getMockRepeatableBallot())
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {}
        }
      ]
    });
    actionSheet.present();
  }

  private createBallot(ballot){

    let ballotsRef = firebase.database().ref('/ballot-config-lists/' + this.userId);
    let newRef = ballotsRef.push();

    newRef.set(ballot)

  }

  private deleteBallot(ballotKey){
    let ballotsRef = firebase.database().ref('/ballot-config-lists/' + this.userId + '/' + ballotKey);
    ballotsRef.remove((r) => {
      
    })
  }

  private shareBallot(shareBallot){

  }

  private sendShareBallot(ballotId, phones, emails){

  }


  openMore(ballotId){
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Ballot Options',
      buttons: [
        {
          text: 'Delete',
          role: 'destructive',
          handler: () => {
            this.deleteBallot(ballotId);
          }
        },{
          text: 'Share',
          handler: () => {
            this.shareBallot(ballotId)
          }
        },{
          text: 'Share to Me (dev)',
          handler: () => {
            this.sendShareBallot(ballotId, ["+16788965681"], ["steven.landers@gmail.com"])
          }
        },{
          text: 'Cancel',
          role: 'cancel',
          handler: () => {}
        }
      ]
    });
    actionSheet.present();
  }


  private toUIBallot(b){
    return {"key": b.key, "val": b.val()}
  }

  private getMockRepeatableBallot(){
    return {
      "Ballot": {
        "Name": "MLB All Star Ballot",
        "Description": "You may vote every 10 seconds for your MLB pick",
        "Requires2FA": false,
        "Attributes":{
          "Image": "https://upload.wikimedia.org/wikipedia/en/6/69/Mlb-asg-2017.png"
        }
      },
      "Decisions": [{
        "Name": "Who is your pick?",
        "Repeatable": true,
        "RepeatVoteDelaySeconds": 10,
        "Options": [{
          "Id": "john",
          "Name": "John"
        }, {
          "Id": "chris",
          "Name": "Chris"
        },{
          "Id": "sam",
          "Name": "Sam"
        }]
      }]
    };
  }

  private getMockBallot(has2Factor){
    return {
      "Ballot": {
        "Name": "Beer Choices",
        "Description": "Help us pick your beer."+(has2Factor? " This requires 2FA." : ""),
        "Requires2FA": has2Factor,
        "Attributes":{
          "Image": "https://rafflecreator.s3.amazonaws.com/2b3fc509-82bb-4d03-8d47-cfe0bd0bba3c.jpg"
        }
      },
      "Decisions": [{
        "Name": "What is your favorite beer color?",
        "Options": [{
          "Id": "red",
          "Name": "Red"
        }, {
          "Id": "gold",
          "Name": "Gold"
        },{
          "Id": "brown",
          "Name": "Brown"
        }]
      }, {
        "Name": "Do you like hops?",
        "Options": [{
          "Id": "yes",
          "Name": "Yes"
        }, {
          "Id": "no",
          "Name": "No"
        }, {
          "Id": "sometimes",
          "Name": "Sometimes"
        }]
      }]
    };
  }

}
