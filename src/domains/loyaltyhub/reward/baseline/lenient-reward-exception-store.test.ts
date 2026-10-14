import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientRewardExceptionStore } from "./lenient-reward-exception-store.js";
import { newLenientRewardException } from "./lenient-reward-exception.js";

test("MemoryLenientRewardExceptionStore finds what it saved", () => {
  const store = newMemoryLenientRewardExceptionStore();
  const item = newLenientRewardException("code-682", "label-646");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
