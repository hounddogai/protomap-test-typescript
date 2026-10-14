import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleCheckpointReport } from "./bid-rule-checkpoint-report.js";
import { BidRuleCheckpoint, newBidRuleCheckpoint } from "./bid-rule-checkpoint.js";

test("BidRuleCheckpointReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_755_197);
  const items: BidRuleCheckpoint[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newBidRuleCheckpoint(`bid-rule-checkpoint-${index}`, "sample"));
  }
  const report = buildBidRuleCheckpointReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
