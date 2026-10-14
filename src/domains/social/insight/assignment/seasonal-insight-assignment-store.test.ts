import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemorySeasonalInsightAssignmentStore } from "./seasonal-insight-assignment-store.js";
import { newSeasonalInsightAssignment } from "./seasonal-insight-assignment.js";

test("MemorySeasonalInsightAssignmentStore finds what it saved", () => {
  const store = newMemorySeasonalInsightAssignmentStore();
  const item = newSeasonalInsightAssignment("code-802", "name-813");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
