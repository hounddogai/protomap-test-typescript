import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualModelDraftReport } from "./manual-model-draft-report.js";
import { ManualModelDraft, newManualModelDraft } from "./manual-model-draft.js";

test("ManualModelDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_020_097);
  const items: ManualModelDraft[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newManualModelDraft(`manual-model-draft-${index}`, "sample"));
  }
  const report = buildManualModelDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
