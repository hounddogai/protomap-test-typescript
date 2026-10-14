import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledJourneyDraftStore } from "./scheduled-journey-draft-store.js";
import { newScheduledJourneyDraft } from "./scheduled-journey-draft.js";

test("MemoryScheduledJourneyDraftStore finds what it saved", () => {
  const store = newMemoryScheduledJourneyDraftStore();
  const item = newScheduledJourneyDraft("code-138", "title-230");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
