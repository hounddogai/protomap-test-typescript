import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryReputationDraftStore } from "./reputation-draft-store.js";
import { newReputationDraft } from "./reputation-draft.js";

test("MemoryReputationDraftStore finds what it saved", () => {
  const store = newMemoryReputationDraftStore();
  const item = newReputationDraft("code-565", "name-286");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
