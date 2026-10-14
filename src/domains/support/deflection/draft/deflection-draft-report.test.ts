import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDeflectionDraftReport } from "./deflection-draft-report.js";
import { DeflectionDraft, newDeflectionDraft } from "./deflection-draft.js";

test("DeflectionDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_202_648);
  const items: DeflectionDraft[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newDeflectionDraft(`deflection-draft-${index}`, "sample"));
  }
  const report = buildDeflectionDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
