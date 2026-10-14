import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPendingBouncePreferenceStore } from "./pending-bounce-preference-store.js";
import { newPendingBouncePreference } from "./pending-bounce-preference.js";

test("MemoryPendingBouncePreferenceStore finds what it saved", () => {
  const store = newMemoryPendingBouncePreferenceStore();
  const item = newPendingBouncePreference("code-378", "label-905");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
