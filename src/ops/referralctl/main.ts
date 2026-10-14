/**
 * Command referralctl runs referral's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import * as flags from "../../kit/flags.js";
import { buildFraudCheckGroupReport } from "../../domains/referral/fraud-check/group/fraud-check-group-report.js";
import { newMemoryFraudCheckGroupStore } from "../../domains/referral/fraud-check/group/fraud-check-group-store.js";
import { newFraudCheckGroupManager } from "../../domains/referral/fraud-check/group/fraud-check-group-workflow.js";
import { newFraudCheckGroup } from "../../domains/referral/fraud-check/group/fraud-check-group.js";
import { buildInviteProfileReport } from "../../domains/referral/invite/segment/invite-profile-report.js";
import { newMemoryInviteProfileStore } from "../../domains/referral/invite/segment/invite-profile-store.js";
import { newInviteProfileCoordinator } from "../../domains/referral/invite/segment/invite-profile-workflow.js";
import { newInviteProfile } from "../../domains/referral/invite/segment/invite-profile.js";
import { buildPayoutReservationReport } from "../../domains/referral/payout/budget/payout-reservation-report.js";
import { newMemoryPayoutReservationStore } from "../../domains/referral/payout/budget/payout-reservation-store.js";
import { newPayoutReservationDesk } from "../../domains/referral/payout/budget/payout-reservation-workflow.js";
import { newPayoutReservation } from "../../domains/referral/payout/budget/payout-reservation.js";
import { buildRewardRulePolicyReport } from "../../domains/referral/reward-rule/policy/reward-rule-policy-report.js";
import {
  newMemoryRewardRulePolicyStore,
} from "../../domains/referral/reward-rule/policy/reward-rule-policy-store.js";
import { newRewardRulePolicyService } from "../../domains/referral/reward-rule/policy/reward-rule-policy-workflow.js";
import { newRewardRulePolicy } from "../../domains/referral/reward-rule/policy/reward-rule-policy.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["invite-profile", (): boolean => {
      const store = newMemoryInviteProfileStore();
      for (let index = 0; index < 6; index++) {
        store.save(newInviteProfile(`invite-profile-${index}`, `Sample invite profile ${index}`));
      }
      const flow = newInviteProfileCoordinator(store, clockValue, flags.newRegistry());
      try {
        flow.advance("invite-profile-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildInviteProfileReport("Invite Profile", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["reward-rule-policy", (): boolean => {
      const store = newMemoryRewardRulePolicyStore();
      for (let index = 0; index < 11; index++) {
        store.save(newRewardRulePolicy(`reward-rule-policy-${index}`, `Sample reward rule policy ${index}`));
      }
      const flow = newRewardRulePolicyService(store, clockValue);
      try {
        flow.start("reward-rule-policy-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildRewardRulePolicyReport("Reward Rule Policy", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["fraud-check-group", (): boolean => {
      const store = newMemoryFraudCheckGroupStore();
      for (let index = 0; index < 3; index++) {
        store.save(newFraudCheckGroup(`fraud-check-group-${index}`, `Sample fraud check group ${index}`));
      }
      const flow = newFraudCheckGroupManager(store, clockValue);
      try {
        flow.advance("fraud-check-group-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildFraudCheckGroupReport("Fraud Check Group", items, clockValue);
      console.log(report.render());
      return flow.reviewStale(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["payout-reservation", (): boolean => {
      const store = newMemoryPayoutReservationStore();
      for (let index = 0; index < 12; index++) {
        store.save(newPayoutReservation(`payout-reservation-${index}`, `Sample payout reservation ${index}`));
      }
      const flow = newPayoutReservationDesk(store, clockValue, flags.newRegistry());
      try {
        flow.advance("payout-reservation-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildPayoutReservationReport("Payout Reservation", items, clockValue);
      console.log(report.render());
      return flow.reviewStale(Math.floor(Date.now() / 1000)) >= 0;
    }],
  ]);
  let failed = 0;
  for (const name of [...commands.keys()].sort()) {
    const command = commands.get(name)!;
    if (!command()) {
      console.log(`${name} failed`);
      failed += 1;
    }
  }
  if (failed > 0) {
    process.exit(1);
  }
}

main();
