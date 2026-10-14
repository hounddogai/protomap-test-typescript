import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWeightedProofDraftReport } from "./weighted-proof-draft-report.js";
import { WeightedProofDraft, newWeightedProofDraft } from "./weighted-proof-draft.js";

test("WeightedProofDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_703_569_291);
  const items: WeightedProofDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newWeightedProofDraft(`weighted-proof-draft-${index}`, "sample"));
  }
  const report = buildWeightedProofDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
