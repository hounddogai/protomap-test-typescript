import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictWindowGroupStore } from "./strict-window-group-store.js";
import { newStrictWindowGroup } from "./strict-window-group.js";

test("MemoryStrictWindowGroupStore finds what it saved", () => {
  const store = newMemoryStrictWindowGroupStore();
  const item = newStrictWindowGroup("code-793", "label-130");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
