/**
 * Command journeysctl runs journeys's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import * as flags from "../../kit/flags.js";
import { buildJourneyScoreReport } from "../../domains/journeys/journey/score/journey-score-report.js";
import { newMemoryJourneyScoreStore } from "../../domains/journeys/journey/score/journey-score-store.js";
import { newJourneyScoreDesk } from "../../domains/journeys/journey/score/journey-score-workflow.js";
import { newJourneyScore } from "../../domains/journeys/journey/score/journey-score.js";
import { buildStepQuotaReport } from "../../domains/journeys/step/quota/step-quota-report.js";
import { newMemoryStepQuotaStore } from "../../domains/journeys/step/quota/step-quota-store.js";
import { newStepQuotaService } from "../../domains/journeys/step/quota/step-quota-workflow.js";
import { newStepQuota } from "../../domains/journeys/step/quota/step-quota.js";
import { buildWaitBaselineReport } from "../../domains/journeys/wait/rule/wait-baseline-report.js";
import { newMemoryWaitBaselineStore } from "../../domains/journeys/wait/rule/wait-baseline-store.js";
import { newWaitBaselineCoordinator } from "../../domains/journeys/wait/rule/wait-baseline-workflow.js";
import { newWaitBaseline } from "../../domains/journeys/wait/rule/wait-baseline.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["journey-score", (): boolean => {
      const store = newMemoryJourneyScoreStore();
      for (let index = 0; index < 11; index++) {
        store.save(newJourneyScore(`journey-score-${index}`, `Sample journey score ${index}`));
      }
      const flow = newJourneyScoreDesk(store, clockValue, flags.newRegistry());
      try {
        flow.open("journey-score-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildJourneyScoreReport("Journey Score", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["step-quota", (): boolean => {
      const store = newMemoryStepQuotaStore();
      for (let index = 0; index < 9; index++) {
        store.save(newStepQuota(`step-quota-${index}`, `Sample step quota ${index}`));
      }
      const flow = newStepQuotaService(store, clockValue, flags.newRegistry());
      try {
        flow.submit("step-quota-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildStepQuotaReport("Step Quota", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["wait-baseline", (): boolean => {
      const store = newMemoryWaitBaselineStore();
      for (let index = 0; index < 12; index++) {
        store.save(newWaitBaseline(`wait-baseline-${index}`, `Sample wait baseline ${index}`));
      }
      const flow = newWaitBaselineCoordinator(store, clockValue);
      try {
        flow.advance("wait-baseline-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildWaitBaselineReport("Wait Baseline", items, clockValue);
      console.log(report.render());
      return flow.audit(Math.floor(Date.now() / 1000)) >= 0;
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
