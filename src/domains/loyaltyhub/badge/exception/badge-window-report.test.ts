import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBadgeWindowReport } from "./badge-window-report.js";
import { BadgeWindow, newBadgeWindow } from "./badge-window.js";

test("BadgeWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_727_739);
  const items: BadgeWindow[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newBadgeWindow(`badge-window-${index}`, "sample"));
  }
  const report = buildBadgeWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
