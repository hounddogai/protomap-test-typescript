import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReplyTierStore } from "./reply-tier-store.js";
import { newReplyTier } from "./reply-tier.js";

test("MemoryReplyTierStore finds what it saved", () => {
  const store = newMemoryReplyTierStore();
  const item = newReplyTier("code-574", "title-696");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
