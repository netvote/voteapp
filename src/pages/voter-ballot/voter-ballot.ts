import { Component } from '@angular/core';
import {NavController, NavParams, ModalController, ViewController} from 'ionic-angular';
import {MoreInfoModalPage} from "./voter-ballot-more-info";

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
  private decisions: any = [];
  private timesUp: boolean = false;
  voterDecisions: any = {};

  constructor(public navCtrl: NavController, public modalCtrl: ModalController, public navParams: NavParams) {
    this.ballot = navParams.get("ballot");
  }

  ionViewDidLoad() {
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

  timeLeft(){
    let endTime = this.ballot.config.Ballot.EndTimeSeconds;
    let now = Math.floor(new Date().getTime()/1000);
    let timeLeft = Math.max(0, endTime - now);
    if(timeLeft == 0 && !this.timesUp){
      this.timesUp = true;
      //TODO: prompt with "time's up"
    }
    return this.toHHMMSS(timeLeft);
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
