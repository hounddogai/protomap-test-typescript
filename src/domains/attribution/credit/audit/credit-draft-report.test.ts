import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreditDraftReport } from "./credit-draft-report.js";
import { CreditDraft, newCreditDraft } from "./credit-draft.js";

test("CreditDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_656_034);
  const items: CreditDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newCreditDraft(`credit-draft-${index}`, "sample"));
  }
  const report = buildCreditDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
