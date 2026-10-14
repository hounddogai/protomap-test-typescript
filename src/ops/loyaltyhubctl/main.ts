/**
 * Command loyaltyhubctl runs loyaltyhub's jobs against sample data.
 */

import * as clock from "../../kit/clock.js";
import * as flags from "../../kit/flags.js";
import { buildBadgeExceptionReport } from "../../domains/loyaltyhub/badge/exception/badge-exception-report.js";
import { newMemoryBadgeExceptionStore } from "../../domains/loyaltyhub/badge/exception/badge-exception-store.js";
import { newBadgeExceptionService } from "../../domains/loyaltyhub/badge/exception/badge-exception-workflow.js";
import { newBadgeException } from "../../domains/loyaltyhub/badge/exception/badge-exception.js";
import { buildChallengeRollupReport } from "../../domains/loyaltyhub/challenge/rollup/challenge-rollup-report.js";
import { newMemoryChallengeRollupStore } from "../../domains/loyaltyhub/challenge/rollup/challenge-rollup-store.js";
import { newChallengeRollupDesk } from "../../domains/loyaltyhub/challenge/rollup/challenge-rollup-workflow.js";
import { newChallengeRollup } from "../../domains/loyaltyhub/challenge/rollup/challenge-rollup.js";
import { buildRewardRequestReport } from "../../domains/loyaltyhub/reward/request/reward-request-report.js";
import { newMemoryRewardRequestStore } from "../../domains/loyaltyhub/reward/request/reward-request-store.js";
import { newRewardRequestService } from "../../domains/loyaltyhub/reward/request/reward-request-workflow.js";
import { newRewardRequest } from "../../domains/loyaltyhub/reward/request/reward-request.js";
import { buildStreakRollupReport } from "../../domains/loyaltyhub/streak/rollup/streak-rollup-report.js";
import { newMemoryStreakRollupStore } from "../../domains/loyaltyhub/streak/rollup/streak-rollup-store.js";
import { newStreakRollupManager } from "../../domains/loyaltyhub/streak/rollup/streak-rollup-workflow.js";
import { newStreakRollup } from "../../domains/loyaltyhub/streak/rollup/streak-rollup.js";

function main(): void {
  const clockValue = clock.system();
  const commands = new Map<string, () => boolean>([
    ["reward-request", (): boolean => {
      const store = newMemoryRewardRequestStore();
      for (let index = 0; index < 8; index++) {
        store.save(newRewardRequest(`reward-request-${index}`, `Sample reward request ${index}`));
      }
      const flow = newRewardRequestService(store, clockValue, flags.newRegistry());
      try {
        flow.advance("reward-request-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildRewardRequestReport("Reward Request", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["badge-exception", (): boolean => {
      const store = newMemoryBadgeExceptionStore();
      for (let index = 0; index < 10; index++) {
        store.save(newBadgeException(`badge-exception-${index}`, `Sample badge exception ${index}`));
      }
      const flow = newBadgeExceptionService(store, clockValue);
      try {
        flow.open("badge-exception-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildBadgeExceptionReport("Badge Exception", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["streak-rollup", (): boolean => {
      const store = newMemoryStreakRollupStore();
      for (let index = 0; index < 8; index++) {
        store.save(newStreakRollup(`streak-rollup-${index}`, `Sample streak rollup ${index}`));
      }
      const flow = newStreakRollupManager(store, clockValue);
      try {
        flow.open("streak-rollup-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildStreakRollupReport("Streak Rollup", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
    }],
    ["challenge-rollup", (): boolean => {
      const store = newMemoryChallengeRollupStore();
      for (let index = 0; index < 12; index++) {
        store.save(newChallengeRollup(`challenge-rollup-${index}`, `Sample challenge rollup ${index}`));
      }
      const flow = newChallengeRollupDesk(store, clockValue);
      try {
        flow.start("challenge-rollup-0");
      } catch {
        return false;
      }
      const items = store.list();
      const report = buildChallengeRollupReport("Challenge Rollup", items, clockValue);
      console.log(report.render());
      return flow.scan(Math.floor(Date.now() / 1000)) >= 0;
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
