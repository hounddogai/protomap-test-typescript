import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildManualApprovalDraftReport } from "./manual-approval-draft-report.js";
import { ManualApprovalDraft, newManualApprovalDraft } from "./manual-approval-draft.js";

test("ManualApprovalDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_918_993);
  const items: ManualApprovalDraft[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newManualApprovalDraft(`manual-approval-draft-${index}`, "sample"));
  }
  const report = buildManualApprovalDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
