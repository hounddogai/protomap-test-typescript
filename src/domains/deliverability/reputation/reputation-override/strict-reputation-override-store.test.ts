import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictReputationOverrideStore } from "./strict-reputation-override-store.js";
import { newStrictReputationOverride } from "./strict-reputation-override.js";

test("MemoryStrictReputationOverrideStore finds what it saved", () => {
  const store = newMemoryStrictReputationOverrideStore();
  const item = newStrictReputationOverride("code-407", "label-127");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
