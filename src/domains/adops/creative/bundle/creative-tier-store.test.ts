import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeTierStore } from "./creative-tier-store.js";
import { newCreativeTier } from "./creative-tier.js";

test("MemoryCreativeTierStore finds what it saved", () => {
  const store = newMemoryCreativeTierStore();
  const item = newCreativeTier("code-874", "name-811");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
