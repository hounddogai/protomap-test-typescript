import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLenientFlightDraftStore } from "./lenient-flight-draft-store.js";
import { newLenientFlightDraft } from "./lenient-flight-draft.js";

test("MemoryLenientFlightDraftStore finds what it saved", () => {
  const store = newMemoryLenientFlightDraftStore();
  const item = newLenientFlightDraft("code-989", "name-686");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
