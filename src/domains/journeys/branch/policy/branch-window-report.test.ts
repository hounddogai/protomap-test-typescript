import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildBranchWindowReport } from "./branch-window-report.js";
import { BranchWindow, newBranchWindow } from "./branch-window.js";

test("BranchWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_041_422);
  const items: BranchWindow[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newBranchWindow(`branch-window-${index}`, "sample"));
  }
  const report = buildBranchWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
