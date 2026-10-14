import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedLeaderboardAgreementEngine } from "./batched-leaderboard-agreement-engine.js";
import { newBatchedLeaderboardAgreement } from "./batched-leaderboard-agreement.js";

test("BatchedLeaderboardAgreementEngine keeps results within bounds", () => {
  const engine = defaultBatchedLeaderboardAgreementEngine(flags.newRegistry());
  const item = newBatchedLeaderboardAgreement("code-318", "title-342");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
