import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFallbackStreakBundleStore } from "./fallback-streak-bundle-store.js";
import { newFallbackStreakBundle } from "./fallback-streak-bundle.js";

test("MemoryFallbackStreakBundleStore finds what it saved", () => {
  const store = newMemoryFallbackStreakBundleStore();
  const item = newFallbackStreakBundle("code-306", "title-762");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
