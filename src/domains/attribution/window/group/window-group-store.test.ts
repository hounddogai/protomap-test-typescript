import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWindowGroupStore } from "./window-group-store.js";
import { newWindowGroup } from "./window-group.js";

test("MemoryWindowGroupStore finds what it saved", () => {
  const store = newMemoryWindowGroupStore();
  const item = newWindowGroup("code-637", "name-579");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
