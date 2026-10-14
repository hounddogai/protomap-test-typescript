import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackSlaOverrideStore } from "./fallback-sla-override-store.js";
import { newFallbackSlaOverride } from "./fallback-sla-override.js";

test("MemoryFallbackSlaOverrideStore finds what it saved", () => {
  const store = newMemoryFallbackSlaOverrideStore();
  const item = newFallbackSlaOverride("code-210", "label-52");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
