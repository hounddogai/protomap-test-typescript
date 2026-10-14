/**
 * Command consentcenterctl runs consentcenter's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import { buildOptOutBatchReport } from "../../domains/consentcenter/opt-out/window/opt-out-batch-report.js";
import { newMemoryOptOutBatchStore } from "../../domains/consentcenter/opt-out/window/opt-out-batch-store.js";
import { newOptOutBatchService } from "../../domains/consentcenter/opt-out/window/opt-out-batch-workflow.js";
import { newOptOutBatch } from "../../domains/consentcenter/opt-out/window/opt-out-batch.js";
import {
  buildPreferenceScheduleReport,
} from "../../domains/consentcenter/preference/schedule/preference-schedule-report.js";
import {
  newMemoryPreferenceScheduleStore,
} from "../../domains/consentcenter/preference/schedule/preference-schedule-store.js";
import {
  newPreferenceScheduleDesk,
} from "../../domains/consentcenter/preference/schedule/preference-schedule-workflow.js";
import { newPreferenceSchedule } from "../../domains/consentcenter/preference/schedule/preference-schedule.js";
import {
  buildSubscriptionEstimateReport,
} from "../../domains/consentcenter/subscription/window/subscription-estimate-report.js";
import {
  newMemorySubscriptionEstimateStore,
} from "../../domains/consentcenter/subscription/window/subscription-estimate-store.js";
import {
  newSubscriptionEstimateService,
} from "../../domains/consentcenter/subscription/window/subscription-estimate-workflow.js";
import { newSubscriptionEstimate } from "../../domains/consentcenter/subscription/window/subscription-estimate.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["subscription-estimate", (): boolean => {
      const store = newMemorySubscriptionEstimateStore();
      for (let index = 0; index < 12; index++) {
        store.save(newSubscriptionEstimate(`subscription-estimate-${index}`, `Sample subscription estimate ${index}`));
      }
      const flow = newSubscriptionEstimateService(store, clockValue);
      try {
        flow.submit("subscription-estimate-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildSubscriptionEstimateReport("Subscription Estimate", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["preference-schedule", (): boolean => {
      const store = newMemoryPreferenceScheduleStore();
      for (let index = 0; index < 5; index++) {
        store.save(newPreferenceSchedule(`preference-schedule-${index}`, `Sample preference schedule ${index}`));
      }
      const flow = newPreferenceScheduleDesk(store, clockValue);
      try {
        flow.open("preference-schedule-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildPreferenceScheduleReport("Preference Schedule", items, clockValue);
      console.log(report.render());
      return flow.audit(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["opt-out-batch", (): boolean => {
      const store = newMemoryOptOutBatchStore();
      for (let index = 0; index < 5; index++) {
        store.save(newOptOutBatch(`opt-out-batch-${index}`, `Sample opt out batch ${index}`));
      }
      const flow = newOptOutBatchService(store, clockValue);
      try {
        flow.open("opt-out-batch-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildOptOutBatchReport("Opt Out Batch", items, clockValue);
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
