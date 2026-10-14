import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationExceptionStore } from "./reputation-exception-store.js";
import { newReputationException } from "./reputation-exception.js";

test("MemoryReputationExceptionStore finds what it saved", () => {
  const store = newMemoryReputationExceptionStore();
  const item = newReputationException("code-429", "label-754");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
