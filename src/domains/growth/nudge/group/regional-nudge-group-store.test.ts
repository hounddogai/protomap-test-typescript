import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryRegionalNudgeGroupStore } from "./regional-nudge-group-store.js";
import { newRegionalNudgeGroup } from "./regional-nudge-group.js";

test("MemoryRegionalNudgeGroupStore finds what it saved", () => {
  const store = newMemoryRegionalNudgeGroupStore();
  const item = newRegionalNudgeGroup("code-601", "title-960");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
