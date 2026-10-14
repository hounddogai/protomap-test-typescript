import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedBounceTierStore } from "./capped-bounce-tier-store.js";
import { newCappedBounceTier } from "./capped-bounce-tier.js";

test("MemoryCappedBounceTierStore finds what it saved", () => {
  const store = newMemoryCappedBounceTierStore();
  const item = newCappedBounceTier("code-101", "name-929");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
