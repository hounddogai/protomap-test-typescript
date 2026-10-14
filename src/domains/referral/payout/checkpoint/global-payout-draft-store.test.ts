import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryGlobalPayoutDraftStore } from "./global-payout-draft-store.js";
import { newGlobalPayoutDraft } from "./global-payout-draft.js";

test("MemoryGlobalPayoutDraftStore finds what it saved", () => {
  const store = newMemoryGlobalPayoutDraftStore();
  const item = newGlobalPayoutDraft("code-389", "title-900");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
