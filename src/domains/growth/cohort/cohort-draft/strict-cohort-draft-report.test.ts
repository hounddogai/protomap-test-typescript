import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictCohortDraftReport } from "./strict-cohort-draft-report.js";
import { StrictCohortDraft, newStrictCohortDraft } from "./strict-cohort-draft.js";

test("StrictCohortDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_096_517);
  const items: StrictCohortDraft[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newStrictCohortDraft(`strict-cohort-draft-${index}`, "sample"));
  }
  const report = buildStrictCohortDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
