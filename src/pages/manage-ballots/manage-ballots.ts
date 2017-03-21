import { Component, ChangeDetectorRef } from '@angular/core';
import {MenuController, ActionSheetController, ToastController} from 'ionic-angular';
import * as firebase from 'firebase';
import {Clipboard} from "ionic-native";

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

  constructor(public actionSheetCtrl: ActionSheetController,
              public menuCtrl: MenuController, public cdr: ChangeDetectorRef, public toastCtrl: ToastController) {}


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
        tmpBallots.push(this.toUIBallot(ballot))
      });
      this.ballots = tmpBallots;
    });

    ballotsRef.on('child_added', (b) => {
      this.ballots.push(this.toUIBallot(b))
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

  addBallot(){
    let actionSheet = this.actionSheetCtrl.create({
      title: 'Ballot Options',
      buttons: [
        {
          text: 'One-Time',
          handler: () => {
            this.saveBallot(this.getMockBallot(false))
          }
        },{
          text: 'One-Time 2FA',
          handler: () => {
            this.saveBallot(this.getMockBallot(true))
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
