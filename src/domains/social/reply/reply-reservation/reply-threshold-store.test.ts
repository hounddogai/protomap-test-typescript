import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyThresholdStore } from "./reply-threshold-store.js";
import { newReplyThreshold } from "./reply-threshold.js";

test("MemoryReplyThresholdStore finds what it saved", () => {
  const store = newMemoryReplyThresholdStore();
  const item = newReplyThreshold("code-941", "name-816");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
