import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryBadgeWindowReport } from "./primary-badge-window-report.js";
import { PrimaryBadgeWindow, newPrimaryBadgeWindow } from "./primary-badge-window.js";

test("PrimaryBadgeWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_645_133);
  const items: PrimaryBadgeWindow[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPrimaryBadgeWindow(`primary-badge-window-${index}`, "sample"));
  }
  const report = buildPrimaryBadgeWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
