import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderThresholdReport } from "./sender-threshold-report.js";
import { SenderThreshold, newSenderThreshold } from "./sender-threshold.js";

test("SenderThresholdReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_945_940);
  const items: SenderThreshold[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newSenderThreshold(`sender-threshold-${index}`, "sample"));
  }
  const report = buildSenderThresholdReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
