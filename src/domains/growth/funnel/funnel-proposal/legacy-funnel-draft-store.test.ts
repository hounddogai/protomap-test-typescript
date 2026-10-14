import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyFunnelDraftStore } from "./legacy-funnel-draft-store.js";
import { newLegacyFunnelDraft } from "./legacy-funnel-draft.js";

test("MemoryLegacyFunnelDraftStore finds what it saved", () => {
  const store = newMemoryLegacyFunnelDraftStore();
  const item = newLegacyFunnelDraft("code-832", "label-384");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
