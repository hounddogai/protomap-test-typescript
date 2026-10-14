import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeWindowReport } from "./nudge-window-report.js";
import { NudgeWindow, newNudgeWindow } from "./nudge-window.js";

test("NudgeWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_346_252);
  const items: NudgeWindow[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newNudgeWindow(`nudge-window-${index}`, "sample"));
  }
  const report = buildNudgeWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
