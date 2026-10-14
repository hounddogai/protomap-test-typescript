import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedInsightDraftStore } from "./weighted-insight-draft-store.js";
import { newWeightedInsightDraft } from "./weighted-insight-draft.js";

test("MemoryWeightedInsightDraftStore finds what it saved", () => {
  const store = newMemoryWeightedInsightDraftStore();
  const item = newWeightedInsightDraft("code-344", "label-938");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
