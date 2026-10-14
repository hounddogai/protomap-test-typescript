import assert from "node:assert/strict";
import { test } from "node:test";
import { toMentionCycleView, toMentionCycleViews } from "./mention-cycle-view.js";
import { newMentionCycle } from "./mention-cycle.js";

test("MentionCycleView shows the status in capitals", () => {
  const item = newMentionCycle("code-662", "title-551");
  const view = toMentionCycleView(item);
  assert.equal(view.statusLabel, `${item.status}`.toUpperCase(), "status label");
  assert.equal(toMentionCycleViews([item, item]).length, 2, "views");
});
