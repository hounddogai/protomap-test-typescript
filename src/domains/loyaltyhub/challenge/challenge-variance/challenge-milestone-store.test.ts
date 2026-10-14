import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryChallengeMilestoneStore } from "./challenge-milestone-store.js";
import { newChallengeMilestone } from "./challenge-milestone.js";

test("MemoryChallengeMilestoneStore finds what it saved", () => {
  const store = newMemoryChallengeMilestoneStore();
  const item = newChallengeMilestone("code-39", "name-902");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
