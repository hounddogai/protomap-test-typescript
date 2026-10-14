/**
 * Command growthctl runs growth's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import {
  buildActivationReservationReport,
} from "../../domains/growth/activation/reservation/activation-reservation-report.js";
import {
  newMemoryActivationReservationStore,
} from "../../domains/growth/activation/reservation/activation-reservation-store.js";
import {
  newActivationReservationDesk,
} from "../../domains/growth/activation/reservation/activation-reservation-workflow.js";
import { newActivationReservation } from "../../domains/growth/activation/reservation/activation-reservation.js";
import { buildCohortVarianceReport } from "../../domains/growth/cohort/baseline/cohort-variance-report.js";
import { newMemoryCohortVarianceStore } from "../../domains/growth/cohort/baseline/cohort-variance-store.js";
import { newCohortVarianceDesk } from "../../domains/growth/cohort/baseline/cohort-variance-workflow.js";
import { newCohortVariance } from "../../domains/growth/cohort/baseline/cohort-variance.js";
import { buildFunnelProfileReport } from "../../domains/growth/funnel/manifest/funnel-profile-report.js";
import { newMemoryFunnelProfileStore } from "../../domains/growth/funnel/manifest/funnel-profile-store.js";
import { newFunnelProfileManager } from "../../domains/growth/funnel/manifest/funnel-profile-workflow.js";
import { newFunnelProfile } from "../../domains/growth/funnel/manifest/funnel-profile.js";
import {
  buildRetentionReservationReport,
} from "../../domains/growth/retention/reservation/retention-reservation-report.js";
import {
  newMemoryRetentionReservationStore,
} from "../../domains/growth/retention/reservation/retention-reservation-store.js";
import {
  newRetentionReservationManager,
} from "../../domains/growth/retention/reservation/retention-reservation-workflow.js";
import { newRetentionReservation } from "../../domains/growth/retention/reservation/retention-reservation.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["funnel-profile", (): boolean => {
      const store = newMemoryFunnelProfileStore();
      for (let index = 0; index < 12; index++) {
        store.save(newFunnelProfile(`funnel-profile-${index}`, `Sample funnel profile ${index}`));
      }
      const flow = newFunnelProfileManager(store, clockValue);
      try {
        flow.submit("funnel-profile-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildFunnelProfileReport("Funnel Profile", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["activation-reservation", (): boolean => {
      const store = newMemoryActivationReservationStore();
      for (let index = 0; index < 8; index++) {
        store.save(newActivationReservation(`activation-reservation-${index}`, `Sample activation reservation ${index}`));
      }
      const flow = newActivationReservationDesk(store, clockValue);
      try {
        flow.advance("activation-reservation-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildActivationReservationReport("Activation Reservation", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["retention-reservation", (): boolean => {
      const store = newMemoryRetentionReservationStore();
      for (let index = 0; index < 4; index++) {
        store.save(newRetentionReservation(`retention-reservation-${index}`, `Sample retention reservation ${index}`));
      }
      const flow = newRetentionReservationManager(store, clockValue);
      try {
        flow.submit("retention-reservation-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildRetentionReservationReport("Retention Reservation", items, clockValue);
      console.log(report.render());
      return flow.audit(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["cohort-variance", (): boolean => {
      const store = newMemoryCohortVarianceStore();
      for (let index = 0; index < 7; index++) {
        store.save(newCohortVariance(`cohort-variance-${index}`, `Sample cohort variance ${index}`));
      }
      const flow = newCohortVarianceDesk(store, clockValue);
      try {
        flow.submit("cohort-variance-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildCohortVarianceReport("Cohort Variance", items, clockValue);
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
