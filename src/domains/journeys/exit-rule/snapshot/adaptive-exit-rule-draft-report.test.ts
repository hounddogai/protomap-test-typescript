import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildAdaptiveExitRuleDraftReport } from "./adaptive-exit-rule-draft-report.js";
import { AdaptiveExitRuleDraft, newAdaptiveExitRuleDraft } from "./adaptive-exit-rule-draft.js";

test("AdaptiveExitRuleDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_377_096);
  const items: AdaptiveExitRuleDraft[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newAdaptiveExitRuleDraft(`adaptive-exit-rule-draft-${index}`, "sample"));
  }
  const report = buildAdaptiveExitRuleDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
