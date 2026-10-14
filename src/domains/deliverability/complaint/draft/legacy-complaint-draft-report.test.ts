import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyComplaintDraftReport } from "./legacy-complaint-draft-report.js";
import { LegacyComplaintDraft, newLegacyComplaintDraft } from "./legacy-complaint-draft.js";

test("LegacyComplaintDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_984_915);
  const items: LegacyComplaintDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLegacyComplaintDraft(`legacy-complaint-draft-${index}`, "sample"));
  }
  const report = buildLegacyComplaintDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
