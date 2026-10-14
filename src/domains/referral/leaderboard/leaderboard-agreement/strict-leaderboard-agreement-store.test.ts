import assert from "node:assert/strict";
import { test } from "node:test";
import { newMemoryStrictLeaderboardAgreementStore } from "./strict-leaderboard-agreement-store.js";
import { newStrictLeaderboardAgreement } from "./strict-leaderboard-agreement.js";

test("MemoryStrictLeaderboardAgreementStore finds what it saved", () => {
  const store = newMemoryStrictLeaderboardAgreementStore();
  const item = newStrictLeaderboardAgreement("code-156", "label-642");
  store.save(item);
  const found = store.find(item.code);
  if (found === undefined) assert.fail("unexpected empty result");
  assert.equal(found.code, item.code, "code");
  assert.equal(store.list().length, 1, "count");
});
