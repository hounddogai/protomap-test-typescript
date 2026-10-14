import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackBounceBaselineStore } from "./fallback-bounce-baseline-store.js";
import { newFallbackBounceBaseline } from "./fallback-bounce-baseline.js";

test("MemoryFallbackBounceBaselineStore finds what it saved", () => {
  const store = newMemoryFallbackBounceBaselineStore();
  const item = newFallbackBounceBaseline("code-587", "title-826");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
