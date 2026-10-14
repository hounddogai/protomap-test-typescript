import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationOverrideStore } from "./reputation-override-store.js";
import { newReputationOverride } from "./reputation-override.js";

test("MemoryReputationOverrideStore finds what it saved", () => {
  const store = newMemoryReputationOverrideStore();
  const item = newReputationOverride("code-463", "label-98");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
