import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryTieredPreferenceGroupStore } from "./tiered-preference-group-store.js";
import { newTieredPreferenceGroup } from "./tiered-preference-group.js";

test("MemoryTieredPreferenceGroupStore finds what it saved", () => {
  const store = newMemoryTieredPreferenceGroupStore();
  const item = newTieredPreferenceGroup("code-876", "label-80");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
