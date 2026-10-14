import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyPacingRollupStore } from "./legacy-pacing-rollup-store.js";
import { newLegacyPacingRollup } from "./legacy-pacing-rollup.js";

test("MemoryLegacyPacingRollupStore finds what it saved", () => {
  const store = newMemoryLegacyPacingRollupStore();
  const item = newLegacyPacingRollup("code-326", "label-531");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
