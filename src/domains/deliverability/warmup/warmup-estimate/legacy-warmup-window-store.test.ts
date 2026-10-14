import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyWarmupWindowStore } from "./legacy-warmup-window-store.js";
import { newLegacyWarmupWindow } from "./legacy-warmup-window.js";

test("MemoryLegacyWarmupWindowStore finds what it saved", () => {
  const store = newMemoryLegacyWarmupWindowStore();
  const item = newLegacyWarmupWindow("code-712", "name-828");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
