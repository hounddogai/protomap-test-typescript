import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientPostWindowReport } from "./lenient-post-window-report.js";
import { LenientPostWindow, newLenientPostWindow } from "./lenient-post-window.js";

test("LenientPostWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_376_456);
  const items: LenientPostWindow[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientPostWindow(`lenient-post-window-${index}`, "sample"));
  }
  const report = buildLenientPostWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
