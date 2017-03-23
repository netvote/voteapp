import { Component, ChangeDetectorRef } from '@angular/core';
import {MenuController, ActionSheetController, ToastController, NavController} from 'ionic-angular';
import * as firebase from 'firebase';
import {Clipboard} from "ionic-native";
import {VoterBallotsPage} from "../voter-ballots/voter-ballots";

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

  constructor(public navCtrl: NavController, public actionSheetCtrl: ActionSheetController,
              public menuCtrl: MenuController, public cdr: ChangeDetectorRef, public toastCtrl: ToastController) {}


  ionViewDidLoad() {
    this.menuCtrl.enable(true);
    this.menuCtrl.swipeEnable(true);
    this.menuCtrl.close();

    let userId = firebase.auth().currentUser.uid;

    this.userId = userId;

    let ballotsRef = firebase.database().ref('/ballot-config-lists/' + userId).orderByKey();

    ballotsRef.on('child_added', (b) => {
      this.ballots.push(this.toUIBallot(b))
      this.cdr.detectChanges();
    });

    ballotsRef.on('child_changed',(b) => {
      let tmpBallots = [];

      this.ballots.forEach((ballot) => {
        if(ballot.key == b.key) {
          tmpBallots.push(this.toUIBallot(b))
        }else{
          tmpBallots.push(ballot)
        }
      });
      this.ballots = tmpBallots;
      this.cdr.detectChanges();
    });

    ballotsRef.on('child_removed', (b) => {
      for(let i=0; i<this.ballots.length; i++){
        if(this.ballots[i].key == b.key){
          this.ballots.splice( i, 1 );
          return;
        }
      }
    });

  }

  private getBallot(key){
    for(let ballot of this.ballots) {
      if (ballot.key == key) {
        return ballot;
      }
    }
    return {"val":{}}; //quack
  }

  isSynced(key){
    return (this.getBallot(key).val.status == "success")
  }

  isSyncing(key){
    return (this.getBallot(key).val.status == "pending")
  }

  // Toggle sidebar
  toggleMenu() {
    this.menuCtrl.toggle();
  }

  getNow(){
    return Math.floor((new Date().getTime()/1000))
  }

  addBallot(){
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Ballot Options',
      buttons: [
        {
          text: 'One-Time',
          handler: () => {
            this.saveBallot(this.getMockBallot(false, this.getNow()));
          }
        },{
          text: 'Future One-Time',
          handler: () => {
            this.saveBallot(this.getMockBallot(false, this.getNow() + 3600));
          }
        },{
          text: 'One-Time 2FA',
          handler: () => {
            this.saveBallot(this.getMockBallot(true, this.getNow()))
          }
        },{
          text: 'Repeatable',
          handler: () => {
            this.saveBallot(this.getMockRepeatableBallot())
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

  private saveBallot(ballot){

    let ballotsRef = firebase.database().ref('/ballot-config-lists/' + this.userId);
    let newRef = ballotsRef.push();

    let updates = {};
    updates['/ballot-configs/'+newRef.key] = {
      status: "pending",
      owner: firebase.auth().currentUser.uid,
      config: ballot
    };
    updates['/ballot-config-lists/' + this.userId+'/'+newRef.key] = {
      status: "pending",
      config: ballot
    };

    return firebase.database().ref().update(updates);

  }

  private deleteBallot(ballotKey){
    let ballotsRef = firebase.database().ref('/ballot-config-lists/' + this.userId + '/' + ballotKey);
    ballotsRef.remove((r) => {});

    let ballotRef = firebase.database().ref('/ballot-configs/' + ballotKey);
    ballotRef.remove((r) => {});

    let resultsRef = firebase.database().ref('/ballot-results/' + ballotKey);
    resultsRef.remove((r) => {});
  }

  private shareBallot(shareBallot){

  }

  private sendShareBallot(ballotId, phones, emails){

  }

  private copyLink(ballotId){
    Clipboard.copy("netvote://ballot/"+ballotId).then((text) => {
      let toast = this.toastCtrl.create({
        message: 'Link copied to clipboard',
        duration: 2000
      });
      toast.present();
    });
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
          text: 'Copy Link',
          handler: () => {
            this.copyLink(ballotId)
          }
        },{
          text: 'Share',
          handler: () => {
            this.shareBallot(ballotId)
          }
        },{
          text: 'Share to Me (dev)',
          handler: () => {
            this.navCtrl.setRoot(VoterBallotsPage, { ballotId: ballotId })
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
        "ResponsesRequired": 1,
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

  private getMockBallot(has2Factor, StartTime){
    return {
      "Ballot": {
        "Name": "Beer Choices",
        "Description": "Help us pick your beer."+(has2Factor? " This requires 2FA." : ""),
        "Requires2FA": has2Factor,
        "StartTimeSeconds": StartTime,
        "EndTimeSeconds": (StartTime + 3600),
        "Attributes":{
          "Image": "https://rafflecreator.s3.amazonaws.com/2b3fc509-82bb-4d03-8d47-cfe0bd0bba3c.jpg"
        }
      },
      "Decisions": [{
        "Name": "What is your favorite beer color?",
        "ResponsesRequired": 2,
        "Description": "We will use this color to build a perfect beer for you",
        "Options": [{
          "Id": "red",
          "Description": "This is somewhere between brick red and dusty rose.",
          "Name": "Red"
        }, {
          "Id": "gold",
          "Description": "Imagine filling a class with sunshine without melting the glass",
          "Name": "Gold"
        },{
          "Id": "brown",
          "Description": "If you like toasted malts, then you'll love toasted malts.",
          "Name": "Brown"
        }]
      }, {
        "Name": "Do you like hops?",
        "ResponsesRequired": 1,
        "Description": "This will let us know whether to make your beer taste like a pine tree.",
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
