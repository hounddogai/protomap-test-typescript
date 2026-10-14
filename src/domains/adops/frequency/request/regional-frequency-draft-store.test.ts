import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalFrequencyDraftStore } from "./regional-frequency-draft-store.js";
import { newRegionalFrequencyDraft } from "./regional-frequency-draft.js";

test("MemoryRegionalFrequencyDraftStore finds what it saved", () => {
  const store = newMemoryRegionalFrequencyDraftStore();
  const item = newRegionalFrequencyDraft("code-735", "name-916");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
