import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackStepOverrideStore } from "./fallback-step-override-store.js";
import { newFallbackStepOverride } from "./fallback-step-override.js";

test("MemoryFallbackStepOverrideStore finds what it saved", () => {
  const store = newMemoryFallbackStepOverrideStore();
  const item = newFallbackStepOverride("code-671", "label-83");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
