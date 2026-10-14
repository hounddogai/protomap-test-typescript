import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryWarmupGroupStore } from "./warmup-group-store.js";
import { newWarmupGroup } from "./warmup-group.js";

test("MemoryWarmupGroupStore finds what it saved", () => {
  const store = newMemoryWarmupGroupStore();
  const item = newWarmupGroup("code-664", "title-707");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
