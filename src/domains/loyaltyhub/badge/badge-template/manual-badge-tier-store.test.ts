import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualBadgeTierStore } from "./manual-badge-tier-store.js";
import { newManualBadgeTier } from "./manual-badge-tier.js";

test("MemoryManualBadgeTierStore finds what it saved", () => {
  const store = newMemoryManualBadgeTierStore();
  const item = newManualBadgeTier("code-910", "name-718");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
