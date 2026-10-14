import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCohortDraftReport } from "./cohort-draft-report.js";
import { CohortDraft, newCohortDraft } from "./cohort-draft.js";

test("CohortDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_443_410);
  const items: CohortDraft[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newCohortDraft(`cohort-draft-${index}`, "sample"));
  }
  const report = buildCohortDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
