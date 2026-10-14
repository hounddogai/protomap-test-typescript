import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildNudgeDraftReport } from "./nudge-draft-report.js";
import { NudgeDraft, newNudgeDraft } from "./nudge-draft.js";

test("NudgeDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_542_805);
  const items: NudgeDraft[] = [];
  for (let index = 0; index < 2; index++) {
    items.push(newNudgeDraft(`nudge-draft-${index}`, "sample"));
  }
  const report = buildNudgeDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 2, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
