import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCappedFrequencyDraftStore } from "./capped-frequency-draft-store.js";
import { newCappedFrequencyDraft } from "./capped-frequency-draft.js";

test("MemoryCappedFrequencyDraftStore finds what it saved", () => {
  const store = newMemoryCappedFrequencyDraftStore();
  const item = newCappedFrequencyDraft("code-419", "title-116");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
