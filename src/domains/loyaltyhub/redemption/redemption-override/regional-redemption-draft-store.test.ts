import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalRedemptionDraftStore } from "./regional-redemption-draft-store.js";
import { newRegionalRedemptionDraft } from "./regional-redemption-draft.js";

test("MemoryRegionalRedemptionDraftStore finds what it saved", () => {
  const store = newMemoryRegionalRedemptionDraftStore();
  const item = newRegionalRedemptionDraft("code-550", "label-5");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
