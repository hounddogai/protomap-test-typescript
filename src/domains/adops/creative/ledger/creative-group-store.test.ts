import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCreativeGroupStore } from "./creative-group-store.js";
import { newCreativeGroup } from "./creative-group.js";

test("MemoryCreativeGroupStore finds what it saved", () => {
  const store = newMemoryCreativeGroupStore();
  const item = newCreativeGroup("code-97", "title-599");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
