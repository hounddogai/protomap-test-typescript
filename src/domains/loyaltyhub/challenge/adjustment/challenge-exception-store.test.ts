import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeExceptionStore } from "./challenge-exception-store.js";
import { newChallengeException } from "./challenge-exception.js";

test("MemoryChallengeExceptionStore finds what it saved", () => {
  const store = newMemoryChallengeExceptionStore();
  const item = newChallengeException("code-780", "label-379");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
