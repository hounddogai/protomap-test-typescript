import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildReplyDraftReport } from "./reply-draft-report.js";
import { ReplyDraft, newReplyDraft } from "./reply-draft.js";

test("ReplyDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_708_890_898);
  const items: ReplyDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newReplyDraft(`reply-draft-${index}`, "sample"));
  }
  const report = buildReplyDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
