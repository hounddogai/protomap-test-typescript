import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalSenderTierStore } from "./regional-sender-tier-store.js";
import { newRegionalSenderTier } from "./regional-sender-tier.js";

test("MemoryRegionalSenderTierStore finds what it saved", () => {
  const store = newMemoryRegionalSenderTierStore();
  const item = newRegionalSenderTier("code-556", "label-659");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
