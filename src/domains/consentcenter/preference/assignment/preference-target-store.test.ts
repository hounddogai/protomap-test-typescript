import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceTargetStore } from "./preference-target-store.js";
import { newPreferenceTarget } from "./preference-target.js";

test("MemoryPreferenceTargetStore finds what it saved", () => {
  const store = newMemoryPreferenceTargetStore();
  const item = newPreferenceTarget("code-383", "label-313");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
