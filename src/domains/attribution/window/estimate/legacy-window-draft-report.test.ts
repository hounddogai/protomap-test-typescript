import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLegacyWindowDraftReport } from "./legacy-window-draft-report.js";
import { LegacyWindowDraft, newLegacyWindowDraft } from "./legacy-window-draft.js";

test("LegacyWindowDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_709_084_542);
  const items: LegacyWindowDraft[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newLegacyWindowDraft(`legacy-window-draft-${index}`, "sample"));
  }
  const report = buildLegacyWindowDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
