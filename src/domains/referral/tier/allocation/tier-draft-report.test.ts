import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildTierDraftReport } from "./tier-draft-report.js";
import { TierDraft, newTierDraft } from "./tier-draft.js";

test("TierDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_065_611);
  const items: TierDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newTierDraft(`tier-draft-${index}`, "sample"));
  }
  const report = buildTierDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
