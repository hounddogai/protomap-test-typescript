import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyDoubleOptInRollupStore } from "./legacy-double-opt-in-rollup-store.js";
import { newLegacyDoubleOptInRollup } from "./legacy-double-opt-in-rollup.js";

test("MemoryLegacyDoubleOptInRollupStore finds what it saved", () => {
  const store = newMemoryLegacyDoubleOptInRollupStore();
  const item = newLegacyDoubleOptInRollup("code-120", "name-664");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
