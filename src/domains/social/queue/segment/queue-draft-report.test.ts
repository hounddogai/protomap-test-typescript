import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildQueueDraftReport } from "./queue-draft-report.js";
import { QueueDraft, newQueueDraft } from "./queue-draft.js";

test("QueueDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_707_585_993);
  const items: QueueDraft[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newQueueDraft(`queue-draft-${index}`, "sample"));
  }
  const report = buildQueueDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
