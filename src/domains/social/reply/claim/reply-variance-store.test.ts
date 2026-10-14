import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyVarianceStore } from "./reply-variance-store.js";
import { newReplyVariance } from "./reply-variance.js";

test("MemoryReplyVarianceStore finds what it saved", () => {
  const store = newMemoryReplyVarianceStore();
  const item = newReplyVariance("code-82", "name-406");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
