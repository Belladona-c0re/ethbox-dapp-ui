import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { TopBarComponent } from './components/top-bar/top-bar.component';
import { BottomBarComponent } from './components/bottom-bar/bottom-bar.component';
import { SendComponent } from './components/send/send.component';
import { BoxesReceivedListComponent } from './components/boxes-received-list/boxes-received-list.component';
import { OverTheCounterComponent } from './components/over-the-counter/over-the-counter.component';
import { BoxesSentListComponent } from './components/boxes-sent-list/boxes-sent-list.component';
import { StakingComponent } from './components/staking/staking.component';
import { PasswordStrengthVisualizerComponent } from './components/password-strength-visualizer/password-strength-visualizer.component';
import { PageNotFoundComponent } from './components/page-not-found/page-not-found.component';
import { BoxReceivedComponent } from './components/boxes-received-list/box-received/box-received.component';
import { BodyBgChangerComponent } from './components/body-bg-changer/body-bg-changer.component';
import { BoxSentComponent } from './components/boxes-sent-list/box-sent/box-sent.component';
import { TokenSelectorComponent } from './components/token-selector/token-selector.component';
import { ComingSoonComponent } from './components/coming-soon/coming-soon.component';
import { LoadingIndicatorComponent } from './components/loading-indicator/loading-indicator.component';
import { AddressBookComponent } from './components/address-book/address-book.component';
import { ToasterNotifierComponent } from './components/toaster-notifier/toaster-notifier.component';
import { GovernanceComponent } from './components/governance/governance.component';
import { GovernanceProposalComponent } from './components/governance/governance-proposal/governance-proposal.component';
import { ToFixedPipe } from './pipes/to-fixed.pipe';
import { VoterComponent } from './components/governance/voter/voter.component';
import { GovernanceAreaComponent } from './components/governance/governance-area/governance-area.component';
import { ViewConsoleComponent } from './components/view-console/view-console.component';

@NgModule({
  declarations: [
    AppComponent,
    TopBarComponent,
    BottomBarComponent,
    SendComponent,
    BoxesReceivedListComponent,
    OverTheCounterComponent,
    BoxesSentListComponent,
    StakingComponent,
    PasswordStrengthVisualizerComponent,
    PageNotFoundComponent,
    BoxReceivedComponent,
    BodyBgChangerComponent,
    BoxSentComponent,
    TokenSelectorComponent,
    ComingSoonComponent,
    ToasterNotifierComponent,
    LoadingIndicatorComponent,
    AddressBookComponent,
    GovernanceComponent,
    GovernanceProposalComponent,
    ToFixedPipe,
    VoterComponent,
    GovernanceAreaComponent,
    ViewConsoleComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
