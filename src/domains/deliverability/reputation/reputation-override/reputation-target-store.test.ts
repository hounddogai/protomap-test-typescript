import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationTargetStore } from "./reputation-target-store.js";
import { newReputationTarget } from "./reputation-target.js";

test("MemoryReputationTargetStore finds what it saved", () => {
  const store = newMemoryReputationTargetStore();
  const item = newReputationTarget("code-798", "title-577");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
