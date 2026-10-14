import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLegacyWindowDraftStore } from "./legacy-window-draft-store.js";
import { newLegacyWindowDraft } from "./legacy-window-draft.js";

test("MemoryLegacyWindowDraftStore finds what it saved", () => {
  const store = newMemoryLegacyWindowDraftStore();
  const item = newLegacyWindowDraft("code-995", "name-309");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
