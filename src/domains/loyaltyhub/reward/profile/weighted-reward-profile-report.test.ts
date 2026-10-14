import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedRewardProfileReport } from "./weighted-reward-profile-report.js";
import { WeightedRewardProfile, newWeightedRewardProfile } from "./weighted-reward-profile.js";

test("WeightedRewardProfileReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_837_740);
  const items: WeightedRewardProfile[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newWeightedRewardProfile(`weighted-reward-profile-${index}`, "sample"));
  }
  const report = buildWeightedRewardProfileReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
