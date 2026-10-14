import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPlacementWindowReport } from "./placement-window-report.js";
import { PlacementWindow, newPlacementWindow } from "./placement-window.js";

test("PlacementWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_186_674);
  const items: PlacementWindow[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPlacementWindow(`placement-window-${index}`, "sample"));
  }
  const report = buildPlacementWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
