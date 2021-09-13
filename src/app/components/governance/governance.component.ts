import { Component, OnInit } from '@angular/core';
import { ContractService } from 'src/app/services/contract.service';
import { GovernanceService } from 'src/app/services/governance.service';
import { LoadingIndicatorService } from 'src/app/services/loading-indicator.service';

@Component({
    selector: 'app-governance',
    templateUrl: './governance.component.html',
    styleUrls: ['./governance.component.css']
})
export class GovernanceComponent implements OnInit {

    datetime = new Date().toUTCString().replace("GMT", "UTC");
    governance = [];
    community = [];
    pageData;
    clockTimer;

    constructor(
        private loadingIndicatorServ: LoadingIndicatorService,
        private governanceServ: GovernanceService) { }

    async ngOnInit() {

        this.clockTimer = setInterval(() => this.datetime = new Date().toUTCString().replace("GMT", "UTC"), 1000);

        this.loadingIndicatorServ.on();
        Promise.all([
            this.governanceServ.getVotings({ isCommunity: false }),
            this.governanceServ.getVotings({ isCommunity: true })
        ]).then(([governance, community]) => {
            this.governance = this.enrichProposal(governance, false);
            this.community = this.enrichProposal(community, true);
            this.loadingIndicatorServ.off();
        });
    }

    ngOnDestroy() {
        clearInterval(this.clockTimer);
    }

    private enrichProposal(proposals, isCommunity) {

        for (let p of proposals) {
            p._id = 'proposal_' + Math.random().toString(36).substring(2);
            p._isCollapsed = true;
            p.startDatetime = new Date(p.time_start * 1e3).toUTCString().replace("GMT", "UTC");
            p.endDatetime = new Date(p.time_end * 1e3).toUTCString().replace("GMT", "UTC");
            p.hasExpired = Date.now() > p.time_end * 1e3;

            p.isEligible = false;
            p.hasVoted = false;
            p.eligibleUsers = [];
            p.votersDetail = [];

            this.governanceServ.getVotes({
                votingNumber: p.n,
                isCommunity: isCommunity
            })
            .then(r => p.votes = r);
            this.governanceServ.getVoters({
                votingNumber: p.n,
                isCommunity: isCommunity
            })
            .then(r => p.eligibleUsers = r);
            this.governanceServ.getVotesDetails({
                votingNumber: p.n,
                isCommunity: isCommunity
            })
            .then(r => p.votersDetail = r);
        }

        return proposals;
    }
 
}
