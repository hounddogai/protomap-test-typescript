import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictReputationExceptionStore } from "./strict-reputation-exception-store.js";
import { newStrictReputationException } from "./strict-reputation-exception.js";

test("MemoryStrictReputationExceptionStore finds what it saved", () => {
  const store = newMemoryStrictReputationExceptionStore();
  const item = newStrictReputationException("code-375", "name-546");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
