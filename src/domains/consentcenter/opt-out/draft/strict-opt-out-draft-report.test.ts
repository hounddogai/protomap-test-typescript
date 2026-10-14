import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictOptOutDraftReport } from "./strict-opt-out-draft-report.js";
import { StrictOptOutDraft, newStrictOptOutDraft } from "./strict-opt-out-draft.js";

test("StrictOptOutDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_782_762);
  const items: StrictOptOutDraft[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newStrictOptOutDraft(`strict-opt-out-draft-${index}`, "sample"));
  }
  const report = buildStrictOptOutDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
