import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryJourneyDraftStore } from "./journey-draft-store.js";
import { newJourneyDraft } from "./journey-draft.js";

test("MemoryJourneyDraftStore finds what it saved", () => {
  const store = newMemoryJourneyDraftStore();
  const item = newJourneyDraft("code-734", "label-268");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
