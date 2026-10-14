import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultFrequencyCycleReport } from "./default-frequency-cycle-report.js";
import { DefaultFrequencyCycle, newDefaultFrequencyCycle } from "./default-frequency-cycle.js";

test("DefaultFrequencyCycleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_038_794);
  const items: DefaultFrequencyCycle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultFrequencyCycle(`default-frequency-cycle-${index}`, "sample"));
  }
  const report = buildDefaultFrequencyCycleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
