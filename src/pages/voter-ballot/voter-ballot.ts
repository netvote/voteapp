import {Component} from '@angular/core';
import {NavController, NavParams, ModalController} from 'ionic-angular';
import {MoreInfoModalPage} from "./voter-ballot-more-info";
import * as firebase from 'firebase';
import {VoterBallotStatusPage} from "./voter-ballot-status";

/*
  Generated class for the VoterBallot page.

  See http://ionicframework.com/docs/v2/components/#navigation for more info on
  Ionic pages and navigation.
*/
@Component({
  selector: 'page-voter-ballot',
  templateUrl: 'voter-ballot.html'
})
export class VoterBallotPage {

  private ballot: any;
  private ballotId: string;
  private userId: string;
  private decisions: any = [];
  private timesUp: boolean = false;
  private timeLeft: string;
  private processing: boolean = false;
  voterDecisions: any = {};
  private refreshInterval: any;

  constructor(public navCtrl: NavController, public modalCtrl: ModalController, public navParams: NavParams) {
    this.ballot = navParams.get("ballot");
    this.ballotId = navParams.get("ballotId");
    this.userId = firebase.auth().currentUser.uid;
  }

  startTimer(){
      this.refreshInterval = setInterval(()=>{
         this.updateTimeLeft();
      }, 500);
  }

  stopTimer(){
      clearInterval(this.refreshInterval);
  }

  ionViewDidEnter(){
     // this.startTimer();
  }

  ionViewWillLeave(){
     // this.stopTimer();
  }

  ionViewDidLoad() {
      this.updateTimeLeft();
      this.decisions = this.ballot.config.Decisions;
      console.log('ionViewDidLoad VoterBallotPage');
      this.decisions.forEach((d) => {
          this.voterDecisions[d.Id] = {
              ResponsesRequired: d.ResponsesRequired,
              Selections: {}
          }
      })
  }

  openInfoModal(option){
    this.modalCtrl.create(MoreInfoModalPage, { option: option }).present()
  }

  private buildVoteDecisions(){
      let result = [];
      this.decisions.forEach((d) => {
        let selections = {};
        let selectionObj = this.voterDecisions[d.Id].Selections;
        for(let optionId in selectionObj){
            if(selectionObj.hasOwnProperty(optionId)){
                if(selectionObj[optionId] == true){
                    selections[optionId] = 1;
                }
            }
        }
        result.push({
            DecisionId: d.Id,
            Selections: selections
        })
      });
      return result;
  }

  castVote(){
      if(!this.processing) {
          this.processing = true;

          let vote = {
              BallotId: this.ballot.config.Ballot.Id,
              Decisions: this.buildVoteDecisions()
          };
          console.log(JSON.stringify(this.voterDecisions));
          console.log(JSON.stringify(vote));
          let voteRef = '/votes/' + this.userId + '/' + this.ballotId;

          let ref = firebase.database().ref(voteRef).push();
          ref.set({
              "vote": vote
          }).then(() => {
              this.modalCtrl.create(VoterBallotStatusPage, { voteRef: voteRef+"/"+ref.key }).present()
              this.processing = false;
          });
      }
  }

  isCastVoteDisabled(){
      for(let decisionId in this.voterDecisions){
          if(this.voterDecisions.hasOwnProperty(decisionId)){
              if(!this.isDecisionComplete(decisionId)){
                  return true;
              }
          }
      }
      return false;
  }

  isDecisionComplete(decisionId){
      let decision = this.voterDecisions[decisionId];
      let required = decision.ResponsesRequired;
      let selection = decision.Selections;
      let count = 0;
      for(let optionId in selection){
          if(selection.hasOwnProperty(optionId)){
              count += (selection[optionId]) ? 1 : 0;
          }
      }
      return (count == required);
  }

  isCheckboxDisabled(decisionId, thisOptionId){
      let required = this.voterDecisions[decisionId].ResponsesRequired;
      let selection = this.voterDecisions[decisionId].Selections;
      let count = 0;
      for(let optionId in selection){
          if(selection.hasOwnProperty(optionId)){
              if(selection[optionId] && optionId == thisOptionId){
                  return false;
              }
              count += (selection[optionId]) ? 1 : 0;
          }
      }
      return count >= required;
  }

  toStringDecisions(){
      return JSON.stringify(this.voterDecisions);
  }

  updateTimeLeft(){
    let endTime = this.ballot.config.Ballot.EndTimeSeconds;
    let now = Math.floor(new Date().getTime()/1000);
    let timeLeft = Math.max(0, endTime - now);
    if(timeLeft == 0 && !this.timesUp){
      this.timesUp = true;
      //TODO: prompt with "time's up"
    }
    this.timeLeft = this.toHHMMSS(timeLeft);
  }

  toHHMMSS(secs) {
    let sec_num = parseInt(secs, 10);
    let hours = Math.floor(sec_num / 3600) % 24;
    let minutes = Math.floor(sec_num / 60) % 60;
    let seconds = sec_num % 60;
    return [hours, minutes, seconds]
        .map(v => v < 10 ? "0" + v : v)
        .filter((v, i) => v !== "00" || i > 0)
        .join(":")
  };

}
