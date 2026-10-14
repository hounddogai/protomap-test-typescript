import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryNudgeGroupStore } from "./nudge-group-store.js";
import { newNudgeGroup } from "./nudge-group.js";

test("MemoryNudgeGroupStore finds what it saved", () => {
  const store = newMemoryNudgeGroupStore();
  const item = newNudgeGroup("code-893", "title-558");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
