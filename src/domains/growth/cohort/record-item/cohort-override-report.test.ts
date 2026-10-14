import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortOverrideReport } from "./cohort-override-report.js";
import { CohortOverride, newCohortOverride } from "./cohort-override.js";

test("CohortOverrideReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_718_330);
  const items: CohortOverride[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newCohortOverride(`cohort-override-${index}`, "sample"));
  }
  const report = buildCohortOverrideReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
