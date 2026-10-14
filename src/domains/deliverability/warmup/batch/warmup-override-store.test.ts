import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupOverrideStore } from "./warmup-override-store.js";
import { newWarmupOverride } from "./warmup-override.js";

test("MemoryWarmupOverrideStore finds what it saved", () => {
  const store = newMemoryWarmupOverrideStore();
  const item = newWarmupOverride("code-91", "name-670");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
