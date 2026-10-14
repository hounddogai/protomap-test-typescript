import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPathAdjustmentReport } from "./path-adjustment-report.js";
import { PathAdjustment, newPathAdjustment } from "./path-adjustment.js";

test("PathAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_144_627);
  const items: PathAdjustment[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newPathAdjustment(`path-adjustment-${index}`, "sample"));
  }
  const report = buildPathAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
