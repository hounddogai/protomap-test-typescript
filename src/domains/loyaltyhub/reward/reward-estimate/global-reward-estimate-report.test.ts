import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalRewardEstimateReport } from "./global-reward-estimate-report.js";
import { GlobalRewardEstimate, newGlobalRewardEstimate } from "./global-reward-estimate.js";

test("GlobalRewardEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_661_967);
  const items: GlobalRewardEstimate[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newGlobalRewardEstimate(`global-reward-estimate-${index}`, "sample"));
  }
  const report = buildGlobalRewardEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
