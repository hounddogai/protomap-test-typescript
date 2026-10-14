import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedRedemptionWindowReport } from "./capped-redemption-window-report.js";
import { CappedRedemptionWindow, newCappedRedemptionWindow } from "./capped-redemption-window.js";

test("CappedRedemptionWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_618_013);
  const items: CappedRedemptionWindow[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCappedRedemptionWindow(`capped-redemption-window-${index}`, "sample"));
  }
  const report = buildCappedRedemptionWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
