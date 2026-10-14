import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPaywallDraftStore } from "./paywall-draft-store.js";
import { newPaywallDraft } from "./paywall-draft.js";

test("MemoryPaywallDraftStore finds what it saved", () => {
  const store = newMemoryPaywallDraftStore();
  const item = newPaywallDraft("code-603", "name-339");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
