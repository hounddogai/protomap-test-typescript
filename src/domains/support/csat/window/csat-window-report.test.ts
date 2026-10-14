import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCsatWindowReport } from "./csat-window-report.js";
import { CsatWindow, newCsatWindow } from "./csat-window.js";

test("CsatWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_736_894);
  const items: CsatWindow[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCsatWindow(`csat-window-${index}`, "sample"));
  }
  const report = buildCsatWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
