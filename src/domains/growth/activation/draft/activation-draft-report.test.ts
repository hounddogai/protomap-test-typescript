import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildActivationDraftReport } from "./activation-draft-report.js";
import { ActivationDraft, newActivationDraft } from "./activation-draft.js";

test("ActivationDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_705_088_641);
  const items: ActivationDraft[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newActivationDraft(`activation-draft-${index}`, "sample"));
  }
  const report = buildActivationDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
