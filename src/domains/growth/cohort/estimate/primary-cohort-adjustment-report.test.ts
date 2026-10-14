import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPrimaryCohortAdjustmentReport } from "./primary-cohort-adjustment-report.js";
import { PrimaryCohortAdjustment, newPrimaryCohortAdjustment } from "./primary-cohort-adjustment.js";

test("PrimaryCohortAdjustmentReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_435_024);
  const items: PrimaryCohortAdjustment[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newPrimaryCohortAdjustment(`primary-cohort-adjustment-${index}`, "sample"));
  }
  const report = buildPrimaryCohortAdjustmentReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
