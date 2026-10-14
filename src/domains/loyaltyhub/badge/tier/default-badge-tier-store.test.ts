import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultBadgeTierStore } from "./default-badge-tier-store.js";
import { newDefaultBadgeTier } from "./default-badge-tier.js";

test("MemoryDefaultBadgeTierStore finds what it saved", () => {
  const store = newMemoryDefaultBadgeTierStore();
  const item = newDefaultBadgeTier("code-359", "label-800");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
