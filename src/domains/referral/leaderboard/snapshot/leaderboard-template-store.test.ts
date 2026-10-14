import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryLeaderboardTemplateStore } from "./leaderboard-template-store.js";
import { newLeaderboardTemplate } from "./leaderboard-template.js";

test("MemoryLeaderboardTemplateStore finds what it saved", () => {
  const store = newMemoryLeaderboardTemplateStore();
  const item = newLeaderboardTemplate("code-643", "name-96");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
