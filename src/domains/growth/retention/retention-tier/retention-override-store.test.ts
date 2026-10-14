import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionOverrideStore } from "./retention-override-store.js";
import { newRetentionOverride } from "./retention-override.js";

test("MemoryRetentionOverrideStore finds what it saved", () => {
  const store = newMemoryRetentionOverrideStore();
  const item = newRetentionOverride("code-905", "title-43");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
