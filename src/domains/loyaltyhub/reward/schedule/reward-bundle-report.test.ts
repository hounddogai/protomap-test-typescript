import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRewardBundleReport } from "./reward-bundle-report.js";
import { RewardBundle, newRewardBundle } from "./reward-bundle.js";

test("RewardBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_200_688);
  const items: RewardBundle[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newRewardBundle(`reward-bundle-${index}`, "sample"));
  }
  const report = buildRewardBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
