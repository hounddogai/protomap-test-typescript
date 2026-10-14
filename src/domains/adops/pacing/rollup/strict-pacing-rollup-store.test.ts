import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictPacingRollupStore } from "./strict-pacing-rollup-store.js";
import { newStrictPacingRollup } from "./strict-pacing-rollup.js";

test("MemoryStrictPacingRollupStore finds what it saved", () => {
  const store = newMemoryStrictPacingRollupStore();
  const item = newStrictPacingRollup("code-690", "title-585");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
