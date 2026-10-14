import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTieredOptOutWindowReport } from "./tiered-opt-out-window-report.js";
import { TieredOptOutWindow, newTieredOptOutWindow } from "./tiered-opt-out-window.js";

test("TieredOptOutWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_809_980);
  const items: TieredOptOutWindow[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newTieredOptOutWindow(`tiered-opt-out-window-${index}`, "sample"));
  }
  const report = buildTieredOptOutWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
