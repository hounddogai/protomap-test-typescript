import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledCreativeOverrideStore } from "./scheduled-creative-override-store.js";
import { newScheduledCreativeOverride } from "./scheduled-creative-override.js";

test("MemoryScheduledCreativeOverrideStore finds what it saved", () => {
  const store = newMemoryScheduledCreativeOverrideStore();
  const item = newScheduledCreativeOverride("code-889", "name-101");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
