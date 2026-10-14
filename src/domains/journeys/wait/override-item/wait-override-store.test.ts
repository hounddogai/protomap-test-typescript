import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWaitOverrideStore } from "./wait-override-store.js";
import { newWaitOverride } from "./wait-override.js";

test("MemoryWaitOverrideStore finds what it saved", () => {
  const store = newMemoryWaitOverrideStore();
  const item = newWaitOverride("code-957", "label-450");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
