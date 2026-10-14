import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildStrictTierDraftReport } from "./strict-tier-draft-report.js";
import { StrictTierDraft, newStrictTierDraft } from "./strict-tier-draft.js";

test("StrictTierDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_322_447);
  const items: StrictTierDraft[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newStrictTierDraft(`strict-tier-draft-${index}`, "sample"));
  }
  const report = buildStrictTierDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
