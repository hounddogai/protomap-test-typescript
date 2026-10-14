import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRollingWaitWindowReport } from "./rolling-wait-window-report.js";
import { RollingWaitWindow, newRollingWaitWindow } from "./rolling-wait-window.js";

test("RollingWaitWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_283_858);
  const items: RollingWaitWindow[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newRollingWaitWindow(`rolling-wait-window-${index}`, "sample"));
  }
  const report = buildRollingWaitWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
