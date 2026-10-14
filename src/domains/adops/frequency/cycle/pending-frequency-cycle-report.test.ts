import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPendingFrequencyCycleReport } from "./pending-frequency-cycle-report.js";
import { PendingFrequencyCycle, newPendingFrequencyCycle } from "./pending-frequency-cycle.js";

test("PendingFrequencyCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_258_137);
  const items: PendingFrequencyCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newPendingFrequencyCycle(`pending-frequency-cycle-${index}`, "sample"));
  }
  const report = buildPendingFrequencyCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
