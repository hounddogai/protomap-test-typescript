import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildFallbackFraudCheckWindowReport } from "./fallback-fraud-check-window-report.js";
import { FallbackFraudCheckWindow, newFallbackFraudCheckWindow } from "./fallback-fraud-check-window.js";

test("FallbackFraudCheckWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_230_283);
  const items: FallbackFraudCheckWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newFallbackFraudCheckWindow(`fallback-fraud-check-window-${index}`, "sample"));
  }
  const report = buildFallbackFraudCheckWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
