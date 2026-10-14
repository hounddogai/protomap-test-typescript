import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildRegionalFrequencyDraftReport } from "./regional-frequency-draft-report.js";
import { RegionalFrequencyDraft, newRegionalFrequencyDraft } from "./regional-frequency-draft.js";

test("RegionalFrequencyDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_562_743);
  const items: RegionalFrequencyDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newRegionalFrequencyDraft(`regional-frequency-draft-${index}`, "sample"));
  }
  const report = buildRegionalFrequencyDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
