import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedBidRuleCycleReport } from "./capped-bid-rule-cycle-report.js";
import { CappedBidRuleCycle, newCappedBidRuleCycle } from "./capped-bid-rule-cycle.js";

test("CappedBidRuleCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_771_570);
  const items: CappedBidRuleCycle[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedBidRuleCycle(`capped-bid-rule-cycle-${index}`, "sample"));
  }
  const report = buildCappedBidRuleCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
