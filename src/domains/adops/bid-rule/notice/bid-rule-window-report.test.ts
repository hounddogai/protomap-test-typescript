import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBidRuleWindowReport } from "./bid-rule-window-report.js";
import { BidRuleWindow, newBidRuleWindow } from "./bid-rule-window.js";

test("BidRuleWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_642_492);
  const items: BidRuleWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newBidRuleWindow(`bid-rule-window-${index}`, "sample"));
  }
  const report = buildBidRuleWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
