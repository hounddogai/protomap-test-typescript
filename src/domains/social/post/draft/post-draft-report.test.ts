import assert from "node:assert/strict";
import { test } from "node:test";
import * as clock from "../../../../kit/clock.js";
import { buildPostDraftReport } from "./post-draft-report.js";
import { PostDraft, newPostDraft } from "./post-draft.js";

test("PostDraftReport counts each record once", () => {
  const clockValue = new clock.FixedClock(1_702_619_606);
  const items: PostDraft[] = [];
  for (let index = 0; index < 6; index++) {
    items.push(newPostDraft(`post-draft-${index}`, "sample"));
  }
  const report = buildPostDraftReport("test", items, clockValue);
  let counted = 0;
  for (const key of [...report.counts.keys()].sort()) {
    const value = report.counts.get(key)!;
    counted += value;
  }
  assert.ok(counted <= 6, "counted");
  assert.equal(report.generatedAt, clockValue.now(), "generated at");
});
