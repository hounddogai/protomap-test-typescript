import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyTicketViewDraftStore } from "./legacy-ticket-view-draft-store.js";
import { newLegacyTicketViewDraft } from "./legacy-ticket-view-draft.js";

test("MemoryLegacyTicketViewDraftStore finds what it saved", () => {
  const store = newMemoryLegacyTicketViewDraftStore();
  const item = newLegacyTicketViewDraft("code-452", "title-487");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
