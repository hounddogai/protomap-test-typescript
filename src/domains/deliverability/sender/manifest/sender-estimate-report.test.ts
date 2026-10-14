import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSenderEstimateReport } from "./sender-estimate-report.js";
import { SenderEstimate, newSenderEstimate } from "./sender-estimate.js";

test("SenderEstimateReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_871_358);
  const items: SenderEstimate[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newSenderEstimate(`sender-estimate-${index}`, "sample"));
  }
  const report = buildSenderEstimateReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
