import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildLenientQueueDraftReport } from "./lenient-queue-draft-report.js";
import { LenientQueueDraft, newLenientQueueDraft } from "./lenient-queue-draft.js";

test("LenientQueueDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_988_487);
  const items: LenientQueueDraft[] = [];
  for (let index = 0; index < 4; index++) {
    items.push(newLenientQueueDraft(`lenient-queue-draft-${index}`, "sample"));
  }
  const report = buildLenientQueueDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 4, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
