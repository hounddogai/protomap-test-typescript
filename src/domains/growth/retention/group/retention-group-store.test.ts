import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRetentionGroupStore } from "./retention-group-store.js";
import { newRetentionGroup } from "./retention-group.js";

test("MemoryRetentionGroupStore finds what it saved", () => {
  const store = newMemoryRetentionGroupStore();
  const item = newRetentionGroup("code-429", "name-186");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
