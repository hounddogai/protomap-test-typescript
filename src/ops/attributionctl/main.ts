/**
 * Command attributionctl runs attribution's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import * as flags from "../../kit/flags.js";
import { buildCreditPolicyReport } from "../../domains/attribution/credit/policy/credit-policy-report.js";
import { newMemoryCreditPolicyStore } from "../../domains/attribution/credit/policy/credit-policy-store.js";
import { newCreditPolicyCoordinator } from "../../domains/attribution/credit/policy/credit-policy-workflow.js";
import { newCreditPolicy } from "../../domains/attribution/credit/policy/credit-policy.js";
import {
  buildSeasonalModelCheckpointReport,
} from "../../domains/attribution/model/checkpoint/seasonal-model-checkpoint-report.js";
import {
  newMemorySeasonalModelCheckpointStore,
} from "../../domains/attribution/model/checkpoint/seasonal-model-checkpoint-store.js";
import {
  newSeasonalModelCheckpointService,
} from "../../domains/attribution/model/checkpoint/seasonal-model-checkpoint-workflow.js";
import { newSeasonalModelCheckpoint } from "../../domains/attribution/model/checkpoint/seasonal-model-checkpoint.js";
import { buildPathEntryReport } from "../../domains/attribution/path/policy/path-entry-report.js";
import { newMemoryPathEntryStore } from "../../domains/attribution/path/policy/path-entry-store.js";
import { newPathEntryDesk } from "../../domains/attribution/path/policy/path-entry-workflow.js";
import { newPathEntry } from "../../domains/attribution/path/policy/path-entry.js";
import {
  buildPrimaryTouchpointTargetReport,
} from "../../domains/attribution/touchpoint/preference/primary-touchpoint-target-report.js";
import {
  newMemoryPrimaryTouchpointTargetStore,
} from "../../domains/attribution/touchpoint/preference/primary-touchpoint-target-store.js";
import {
  newPrimaryTouchpointTargetDesk,
} from "../../domains/attribution/touchpoint/preference/primary-touchpoint-target-workflow.js";
import {
  newPrimaryTouchpointTarget,
} from "../../domains/attribution/touchpoint/preference/primary-touchpoint-target.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["primary-touchpoint-target", (): boolean => {
      const store = newMemoryPrimaryTouchpointTargetStore();
      for (let index = 0; index < 7; index++) {
        store.save(newPrimaryTouchpointTarget(`primary-touchpoint-target-${index}`, `Sample primary touchpoint target ${index}`));
      }
      const flow = newPrimaryTouchpointTargetDesk(store, clockValue);
      try {
        flow.advance("primary-touchpoint-target-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildPrimaryTouchpointTargetReport("Primary Touchpoint Target", items, clockValue);
      console.log(report.render());
      return flow.reviewStale(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["seasonal-model-checkpoint", (): boolean => {
      const store = newMemorySeasonalModelCheckpointStore();
      for (let index = 0; index < 9; index++) {
        store.save(newSeasonalModelCheckpoint(`seasonal-model-checkpoint-${index}`, `Sample seasonal model checkpoint ${index}`));
      }
      const flow = newSeasonalModelCheckpointService(store, clockValue);
      try {
        flow.submit("seasonal-model-checkpoint-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildSeasonalModelCheckpointReport("Seasonal Model Checkpoint", items, clockValue);
      console.log(report.render());
      return flow.sweep(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["credit-policy", (): boolean => {
      const store = newMemoryCreditPolicyStore();
      for (let index = 0; index < 12; index++) {
        store.save(newCreditPolicy(`credit-policy-${index}`, `Sample credit policy ${index}`));
      }
      const flow = newCreditPolicyCoordinator(store, clockValue);
      try {
        flow.advance("credit-policy-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildCreditPolicyReport("Credit Policy", items, clockValue);
      console.log(report.render());
      return flow.reviewStale(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["path-entry", (): boolean => {
      const store = newMemoryPathEntryStore();
      for (let index = 0; index < 9; index++) {
        store.save(newPathEntry(`path-entry-${index}`, `Sample path entry ${index}`));
      }
      const flow = newPathEntryDesk(store, clockValue, flags.newRegistry());
      try {
        flow.start("path-entry-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildPathEntryReport("Path Entry", items, clockValue);
      console.log(report.render());
      return flow.sweep(Math.floor(Date.now() / 1000)) >= 0;
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
