import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedEnrollmentDraftReport } from "./capped-enrollment-draft-report.js";
import { CappedEnrollmentDraft, newCappedEnrollmentDraft } from "./capped-enrollment-draft.js";

test("CappedEnrollmentDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_096_097);
  const items: CappedEnrollmentDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCappedEnrollmentDraft(`capped-enrollment-draft-${index}`, "sample"));
  }
  const report = buildCappedEnrollmentDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
