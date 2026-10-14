import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPrimaryRewardExceptionStore } from "./primary-reward-exception-store.js";
import { newPrimaryRewardException } from "./primary-reward-exception.js";

test("MemoryPrimaryRewardExceptionStore finds what it saved", () => {
  const store = newMemoryPrimaryRewardExceptionStore();
  const item = newPrimaryRewardException("code-863", "title-612");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
