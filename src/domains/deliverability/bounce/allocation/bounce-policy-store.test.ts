import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBouncePolicyStore } from "./bounce-policy-store.js";
import { newBouncePolicy } from "./bounce-policy.js";

test("MemoryBouncePolicyStore finds what it saved", () => {
  const store = newMemoryBouncePolicyStore();
  const item = newBouncePolicy("code-305", "name-752");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
