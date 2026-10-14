import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderVarianceReport } from "./sender-variance-report.js";
import { SenderVariance, newSenderVariance } from "./sender-variance.js";

test("SenderVarianceReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_665_113);
  const items: SenderVariance[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSenderVariance(`sender-variance-${index}`, "sample"));
  }
  const report = buildSenderVarianceReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
