import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleSegmentReport } from "./bid-rule-segment-report.js";
import { BidRuleSegment, newBidRuleSegment } from "./bid-rule-segment.js";

test("BidRuleSegmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_922_898);
  const items: BidRuleSegment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBidRuleSegment(`bid-rule-segment-${index}`, "sample"));
  }
  const report = buildBidRuleSegmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
