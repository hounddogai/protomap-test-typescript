import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildSuppressionRequestReport } from "./suppression-request-report.js";
import { SuppressionRequest, newSuppressionRequest } from "./suppression-request.js";

test("SuppressionRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_869_390);
  const items: SuppressionRequest[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newSuppressionRequest(`suppression-request-${index}`, "sample"));
  }
  const report = buildSuppressionRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
