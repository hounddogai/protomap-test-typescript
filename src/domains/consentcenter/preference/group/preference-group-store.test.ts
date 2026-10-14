import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryPreferenceGroupStore } from "./preference-group-store.js";
import { newPreferenceGroup } from "./preference-group.js";

test("MemoryPreferenceGroupStore finds what it saved", () => {
  const store = newMemoryPreferenceGroupStore();
  const item = newPreferenceGroup("code-719", "title-587");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
