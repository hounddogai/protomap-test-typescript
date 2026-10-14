import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryProofGroupStore } from "./proof-group-store.js";
import { newProofGroup } from "./proof-group.js";

test("MemoryProofGroupStore finds what it saved", () => {
  const store = newMemoryProofGroupStore();
  const item = newProofGroup("code-932", "title-572");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
