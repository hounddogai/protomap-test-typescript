import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultPathAdjustmentReport } from "./default-path-adjustment-report.js";
import { DefaultPathAdjustment, newDefaultPathAdjustment } from "./default-path-adjustment.js";

test("DefaultPathAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_287_503);
  const items: DefaultPathAdjustment[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDefaultPathAdjustment(`default-path-adjustment-${index}`, "sample"));
  }
  const report = buildDefaultPathAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
