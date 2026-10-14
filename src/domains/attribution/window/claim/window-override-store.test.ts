import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowOverrideStore } from "./window-override-store.js";
import { newWindowOverride } from "./window-override.js";

test("MemoryWindowOverrideStore finds what it saved", () => {
  const store = newMemoryWindowOverrideStore();
  const item = newWindowOverride("code-131", "title-390");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
