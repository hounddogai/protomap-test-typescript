import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryDefaultFrequencyDraftStore } from "./default-frequency-draft-store.js";
import { newDefaultFrequencyDraft } from "./default-frequency-draft.js";

test("MemoryDefaultFrequencyDraftStore finds what it saved", () => {
  const store = newMemoryDefaultFrequencyDraftStore();
  const item = newDefaultFrequencyDraft("code-207", "label-734");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
