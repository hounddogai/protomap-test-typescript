import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySlaTierStore } from "./sla-tier-store.js";
import { newSlaTier } from "./sla-tier.js";

test("MemorySlaTierStore finds what it saved", () => {
  const store = newMemorySlaTierStore();
  const item = newSlaTier("code-814", "name-152");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
