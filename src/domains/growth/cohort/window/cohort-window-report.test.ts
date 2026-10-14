import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortWindowReport } from "./cohort-window-report.js";
import { CohortWindow, newCohortWindow } from "./cohort-window.js";

test("CohortWindowReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_368_559);
  const items: CohortWindow[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCohortWindow(`cohort-window-${index}`, "sample"));
  }
  const report = buildCohortWindowReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
