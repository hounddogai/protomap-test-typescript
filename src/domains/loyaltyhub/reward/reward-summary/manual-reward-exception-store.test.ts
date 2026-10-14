import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualRewardExceptionStore } from "./manual-reward-exception-store.js";
import { newManualRewardException } from "./manual-reward-exception.js";

test("MemoryManualRewardExceptionStore finds what it saved", () => {
  const store = newMemoryManualRewardExceptionStore();
  const item = newManualRewardException("code-999", "name-124");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
