import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientCohortGroupReport } from "./lenient-cohort-group-report.js";
import { LenientCohortGroup, newLenientCohortGroup } from "./lenient-cohort-group.js";

test("LenientCohortGroupReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_950_421);
  const items: LenientCohortGroup[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newLenientCohortGroup(`lenient-cohort-group-${index}`, "sample"));
  }
  const report = buildLenientCohortGroupReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
