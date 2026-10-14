import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryExitRuleCheckpointStore } from "./exit-rule-checkpoint-store.js";
import { newExitRuleCheckpoint } from "./exit-rule-checkpoint.js";

test("MemoryExitRuleCheckpointStore finds what it saved", () => {
  const store = newMemoryExitRuleCheckpointStore();
  const item = newExitRuleCheckpoint("code-637", "title-386");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
