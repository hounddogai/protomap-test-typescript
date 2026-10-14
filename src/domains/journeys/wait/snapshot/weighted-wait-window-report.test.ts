import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedWaitWindowReport } from "./weighted-wait-window-report.js";
import { WeightedWaitWindow, newWeightedWaitWindow } from "./weighted-wait-window.js";

test("WeightedWaitWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_284_977);
  const items: WeightedWaitWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWeightedWaitWindow(`weighted-wait-window-${index}`, "sample"));
  }
  const report = buildWeightedWaitWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
