import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCappedWarmupDraftReport } from "./capped-warmup-draft-report.js";
import { CappedWarmupDraft, newCappedWarmupDraft } from "./capped-warmup-draft.js";

test("CappedWarmupDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_280_890);
  const items: CappedWarmupDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newCappedWarmupDraft(`capped-warmup-draft-${index}`, "sample"));
  }
  const report = buildCappedWarmupDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
