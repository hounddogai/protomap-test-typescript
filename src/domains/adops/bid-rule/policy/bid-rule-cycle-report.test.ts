import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleCycleReport } from "./bid-rule-cycle-report.js";
import { BidRuleCycle, newBidRuleCycle } from "./bid-rule-cycle.js";

test("BidRuleCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_521_413);
  const items: BidRuleCycle[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBidRuleCycle(`bid-rule-cycle-${index}`, "sample"));
  }
  const report = buildBidRuleCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
