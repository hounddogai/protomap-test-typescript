import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredRetentionDraftStore } from "./tiered-retention-draft-store.js";
import { newTieredRetentionDraft } from "./tiered-retention-draft.js";

test("MemoryTieredRetentionDraftStore finds what it saved", () => {
  const store = newMemoryTieredRetentionDraftStore();
  const item = newTieredRetentionDraft("code-252", "name-861");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
