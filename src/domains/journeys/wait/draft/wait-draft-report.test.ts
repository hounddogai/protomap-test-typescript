import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildWaitDraftReport } from "./wait-draft-report.js";
import { WaitDraft, newWaitDraft } from "./wait-draft.js";

test("WaitDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_701_720_934);
  const items: WaitDraft[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newWaitDraft(`wait-draft-${index}`, "sample"));
  }
  const report = buildWaitDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
