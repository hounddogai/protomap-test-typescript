import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingRedemptionWindowReport } from "./rolling-redemption-window-report.js";
import { RollingRedemptionWindow, newRollingRedemptionWindow } from "./rolling-redemption-window.js";

test("RollingRedemptionWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_808_380);
  const items: RollingRedemptionWindow[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newRollingRedemptionWindow(`rolling-redemption-window-${index}`, "sample"));
  }
  const report = buildRollingRedemptionWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
