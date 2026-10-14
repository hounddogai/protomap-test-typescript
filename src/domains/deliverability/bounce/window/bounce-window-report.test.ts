import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBounceWindowReport } from "./bounce-window-report.js";
import { BounceWindow, newBounceWindow } from "./bounce-window.js";

test("BounceWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_670_990);
  const items: BounceWindow[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBounceWindow(`bounce-window-${index}`, "sample"));
  }
  const report = buildBounceWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
