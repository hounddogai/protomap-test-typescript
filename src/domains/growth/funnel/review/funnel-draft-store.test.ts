import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFunnelDraftStore } from "./funnel-draft-store.js";
import { newFunnelDraft } from "./funnel-draft.js";

test("MemoryFunnelDraftStore finds what it saved", () => {
  const store = newMemoryFunnelDraftStore();
  const item = newFunnelDraft("code-170", "name-383");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
