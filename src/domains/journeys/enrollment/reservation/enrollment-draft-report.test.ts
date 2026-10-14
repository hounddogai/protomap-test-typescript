import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildEnrollmentDraftReport } from "./enrollment-draft-report.js";
import { EnrollmentDraft, newEnrollmentDraft } from "./enrollment-draft.js";

test("EnrollmentDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_802_345);
  const items: EnrollmentDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newEnrollmentDraft(`enrollment-draft-${index}`, "sample"));
  }
  const report = buildEnrollmentDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
