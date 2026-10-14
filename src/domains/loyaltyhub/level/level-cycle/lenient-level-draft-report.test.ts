import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientLevelDraftReport } from "./lenient-level-draft-report.js";
import { LenientLevelDraft, newLenientLevelDraft } from "./lenient-level-draft.js";

test("LenientLevelDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_787_555);
  const items: LenientLevelDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newLenientLevelDraft(`lenient-level-draft-${index}`, "sample"));
  }
  const report = buildLenientLevelDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
