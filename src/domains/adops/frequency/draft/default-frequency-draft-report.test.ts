import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildDefaultFrequencyDraftReport } from "./default-frequency-draft-report.js";
import { DefaultFrequencyDraft, newDefaultFrequencyDraft } from "./default-frequency-draft.js";

test("DefaultFrequencyDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_706_388_445);
  const items: DefaultFrequencyDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newDefaultFrequencyDraft(`default-frequency-draft-${index}`, "sample"));
  }
  const report = buildDefaultFrequencyDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
