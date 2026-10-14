import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildCreativeDraftReport } from "./creative-draft-report.js";
import { CreativeDraft, newCreativeDraft } from "./creative-draft.js";

test("CreativeDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_704_906_444);
  const items: CreativeDraft[] = [];
  for (let index = 0; index < 3; index++) {
    items.push(newCreativeDraft(`creative-draft-${index}`, "sample"));
  }
  const report = buildCreativeDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 3, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
