import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyMentionMilestoneStore } from "./legacy-mention-milestone-store.js";
import { newLegacyMentionMilestone } from "./legacy-mention-milestone.js";

test("MemoryLegacyMentionMilestoneStore finds what it saved", () => {
  const store = newMemoryLegacyMentionMilestoneStore();
  const item = newLegacyMentionMilestone("code-800", "label-16");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
