import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofRequestStore } from "./proof-request-store.js";
import { newProofRequest } from "./proof-request.js";

test("MemoryProofRequestStore finds what it saved", () => {
  const store = newMemoryProofRequestStore();
  const item = newProofRequest("code-495", "label-148");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
