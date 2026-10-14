import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryManualFrequencyDraftStore } from "./manual-frequency-draft-store.js";
import { newManualFrequencyDraft } from "./manual-frequency-draft.js";

test("MemoryManualFrequencyDraftStore finds what it saved", () => {
  const store = newMemoryManualFrequencyDraftStore();
  const item = newManualFrequencyDraft("code-932", "title-545");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
