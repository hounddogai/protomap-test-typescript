import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedInviteTierReport } from "./weighted-invite-tier-report.js";
import { WeightedInviteTier, newWeightedInviteTier } from "./weighted-invite-tier.js";

test("WeightedInviteTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_503_511);
  const items: WeightedInviteTier[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newWeightedInviteTier(`weighted-invite-tier-${index}`, "sample"));
  }
  const report = buildWeightedInviteTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
