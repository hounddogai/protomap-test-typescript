import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredWindowExceptionStore } from "./tiered-window-exception-store.js";
import { newTieredWindowException } from "./tiered-window-exception.js";

test("MemoryTieredWindowExceptionStore finds what it saved", () => {
  const store = newMemoryTieredWindowExceptionStore();
  const item = newTieredWindowException("code-333", "title-955");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
