import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualReplyVarianceStore } from "./manual-reply-variance-store.js";
import { newManualReplyVariance } from "./manual-reply-variance.js";

test("MemoryManualReplyVarianceStore finds what it saved", () => {
  const store = newMemoryManualReplyVarianceStore();
  const item = newManualReplyVariance("code-952", "label-267");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
