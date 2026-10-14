import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryBounceTierStore } from "./bounce-tier-store.js";
import { newBounceTier } from "./bounce-tier.js";

test("MemoryBounceTierStore finds what it saved", () => {
  const store = newMemoryBounceTierStore();
  const item = newBounceTier("code-550", "name-551");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
