import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPacingRollupStore } from "./pacing-rollup-store.js";
import { newPacingRollup } from "./pacing-rollup.js";

test("MemoryPacingRollupStore finds what it saved", () => {
  const store = newMemoryPacingRollupStore();
  const item = newPacingRollup("code-424", "title-127");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
