import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedInviteTargetReport } from "./weighted-invite-target-report.js";
import { WeightedInviteTarget, newWeightedInviteTarget } from "./weighted-invite-target.js";

test("WeightedInviteTargetReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_453_760);
  const items: WeightedInviteTarget[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedInviteTarget(`weighted-invite-target-${index}`, "sample"));
  }
  const report = buildWeightedInviteTargetReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
