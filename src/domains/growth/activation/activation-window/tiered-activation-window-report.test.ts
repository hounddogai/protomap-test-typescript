import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredActivationWindowReport } from "./tiered-activation-window-report.js";
import { TieredActivationWindow, newTieredActivationWindow } from "./tiered-activation-window.js";

test("TieredActivationWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_431_719);
  const items: TieredActivationWindow[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newTieredActivationWindow(`tiered-activation-window-${index}`, "sample"));
  }
  const report = buildTieredActivationWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
