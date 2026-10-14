import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedReputationDraftStore } from "./weighted-reputation-draft-store.js";
import { newWeightedReputationDraft } from "./weighted-reputation-draft.js";

test("MemoryWeightedReputationDraftStore finds what it saved", () => {
  const store = newMemoryWeightedReputationDraftStore();
  const item = newWeightedReputationDraft("code-802", "name-144");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
