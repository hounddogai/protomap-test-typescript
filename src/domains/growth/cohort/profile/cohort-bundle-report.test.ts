import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortBundleReport } from "./cohort-bundle-report.js";
import { CohortBundle, newCohortBundle } from "./cohort-bundle.js";

test("CohortBundleReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_243_799);
  const items: CohortBundle[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCohortBundle(`cohort-bundle-${index}`, "sample"));
  }
  const report = buildCohortBundleReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
