import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalStepDraftStore } from "./seasonal-step-draft-store.js";
import { newSeasonalStepDraft } from "./seasonal-step-draft.js";

test("MemorySeasonalStepDraftStore finds what it saved", () => {
  const store = newMemorySeasonalStepDraftStore();
  const item = newSeasonalStepDraft("code-53", "name-231");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
