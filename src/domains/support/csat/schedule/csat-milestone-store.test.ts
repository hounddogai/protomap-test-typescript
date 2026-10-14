import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryCsatMilestoneStore } from "./csat-milestone-store.js";
import { newCsatMilestone } from "./csat-milestone.js";

test("MemoryCsatMilestoneStore finds what it saved", () => {
  const store = newMemoryCsatMilestoneStore();
  const item = newCsatMilestone("code-978", "title-208");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
