import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingOptOutTierReport } from "./pending-opt-out-tier-report.js";
import { PendingOptOutTier, newPendingOptOutTier } from "./pending-opt-out-tier.js";

test("PendingOptOutTierReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_541_407);
  const items: PendingOptOutTier[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingOptOutTier(`pending-opt-out-tier-${index}`, "sample"));
  }
  const report = buildPendingOptOutTierReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
