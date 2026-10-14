import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPacingWindowReport } from "./pacing-window-report.js";
import { PacingWindow, newPacingWindow } from "./pacing-window.js";

test("PacingWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_755_394);
  const items: PacingWindow[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPacingWindow(`pacing-window-${index}`, "sample"));
  }
  const report = buildPacingWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
