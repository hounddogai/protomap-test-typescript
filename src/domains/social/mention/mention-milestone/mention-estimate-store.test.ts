import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryMentionEstimateStore } from "./mention-estimate-store.js";
import { newMentionEstimate } from "./mention-estimate.js";

test("MemoryMentionEstimateStore finds what it saved", () => {
  const store = newMemoryMentionEstimateStore();
  const item = newMentionEstimate("code-437", "title-244");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
