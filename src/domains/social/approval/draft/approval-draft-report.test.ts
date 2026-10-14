import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildApprovalDraftReport } from "./approval-draft-report.js";
import { ApprovalDraft, newApprovalDraft } from "./approval-draft.js";

test("ApprovalDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_623_006);
  const items: ApprovalDraft[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newApprovalDraft(`approval-draft-${index}`, "sample"));
  }
  const report = buildApprovalDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
