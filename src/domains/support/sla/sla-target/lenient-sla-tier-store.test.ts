import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientSlaTierStore } from "./lenient-sla-tier-store.js";
import { newLenientSlaTier } from "./lenient-sla-tier.js";

test("MemoryLenientSlaTierStore finds what it saved", () => {
  const store = newMemoryLenientSlaTierStore();
  const item = newLenientSlaTier("code-163", "label-711");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
