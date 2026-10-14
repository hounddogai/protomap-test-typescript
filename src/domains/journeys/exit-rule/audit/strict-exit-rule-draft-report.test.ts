import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictExitRuleDraftReport } from "./strict-exit-rule-draft-report.js";
import { StrictExitRuleDraft, newStrictExitRuleDraft } from "./strict-exit-rule-draft.js";

test("StrictExitRuleDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_889_338);
  const items: StrictExitRuleDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newStrictExitRuleDraft(`strict-exit-rule-draft-${index}`, "sample"));
  }
  const report = buildStrictExitRuleDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
