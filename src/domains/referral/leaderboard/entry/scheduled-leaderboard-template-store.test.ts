import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryScheduledLeaderboardTemplateStore } from "./scheduled-leaderboard-template-store.js";
import { newScheduledLeaderboardTemplate } from "./scheduled-leaderboard-template.js";

test("MemoryScheduledLeaderboardTemplateStore finds what it saved", () => {
  const store = newMemoryScheduledLeaderboardTemplateStore();
  const item = newScheduledLeaderboardTemplate("code-348", "name-588");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
