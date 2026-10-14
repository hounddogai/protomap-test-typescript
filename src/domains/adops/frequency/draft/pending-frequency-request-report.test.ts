import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingFrequencyRequestReport } from "./pending-frequency-request-report.js";
import { PendingFrequencyRequest, newPendingFrequencyRequest } from "./pending-frequency-request.js";

test("PendingFrequencyRequestReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_059_931);
  const items: PendingFrequencyRequest[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newPendingFrequencyRequest(`pending-frequency-request-${index}`, "sample"));
  }
  const report = buildPendingFrequencyRequestReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
