import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryFrequencyGroupStore } from "./frequency-group-store.js";
import { newFrequencyGroup } from "./frequency-group.js";

test("MemoryFrequencyGroupStore finds what it saved", () => {
  const store = newMemoryFrequencyGroupStore();
  const item = newFrequencyGroup("code-869", "label-883");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
