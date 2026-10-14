import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWeightedEscalationDraftStore } from "./weighted-escalation-draft-store.js";
import { newWeightedEscalationDraft } from "./weighted-escalation-draft.js";

test("MemoryWeightedEscalationDraftStore finds what it saved", () => {
  const store = newMemoryWeightedEscalationDraftStore();
  const item = newWeightedEscalationDraft("code-902", "title-789");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
