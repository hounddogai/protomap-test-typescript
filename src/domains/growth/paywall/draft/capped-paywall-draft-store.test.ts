import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedPaywallDraftStore } from "./capped-paywall-draft-store.js";
import { newCappedPaywallDraft } from "./capped-paywall-draft.js";

test("MemoryCappedPaywallDraftStore finds what it saved", () => {
  const store = newMemoryCappedPaywallDraftStore();
  const item = newCappedPaywallDraft("code-410", "title-783");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
