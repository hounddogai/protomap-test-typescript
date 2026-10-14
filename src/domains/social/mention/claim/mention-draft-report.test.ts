import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildMentionDraftReport } from "./mention-draft-report.js";
import { MentionDraft, newMentionDraft } from "./mention-draft.js";

test("MentionDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_700_133_066);
  const items: MentionDraft[] = [];
  for (let index = 0; index < 5; index++) {
    items.push(newMentionDraft(`mention-draft-${index}`, "sample"));
  }
  const report = buildMentionDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 5, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
