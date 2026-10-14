import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredBounceDraftStore } from "./tiered-bounce-draft-store.js";
import { newTieredBounceDraft } from "./tiered-bounce-draft.js";

test("MemoryTieredBounceDraftStore finds what it saved", () => {
  const store = newMemoryTieredBounceDraftStore();
  const item = newTieredBounceDraft("code-36", "name-410");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
