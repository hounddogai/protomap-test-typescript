import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyCreativeTargetStore } from "./legacy-creative-target-store.js";
import { newLegacyCreativeTarget } from "./legacy-creative-target.js";

test("MemoryLegacyCreativeTargetStore finds what it saved", () => {
  const store = newMemoryLegacyCreativeTargetStore();
  const item = newLegacyCreativeTarget("code-204", "title-584");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
