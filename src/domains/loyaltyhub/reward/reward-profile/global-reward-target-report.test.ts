import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildGlobalRewardTargetReport } from "./global-reward-target-report.js";
import { GlobalRewardTarget, newGlobalRewardTarget } from "./global-reward-target.js";

test("GlobalRewardTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_999_766);
  const items: GlobalRewardTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newGlobalRewardTarget(`global-reward-target-${index}`, "sample"));
  }
  const report = buildGlobalRewardTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
