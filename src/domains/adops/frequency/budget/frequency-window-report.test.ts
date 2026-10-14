import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFrequencyWindowReport } from "./frequency-window-report.js";
import { FrequencyWindow, newFrequencyWindow } from "./frequency-window.js";

test("FrequencyWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_940_613);
  const items: FrequencyWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFrequencyWindow(`frequency-window-${index}`, "sample"));
  }
  const report = buildFrequencyWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
