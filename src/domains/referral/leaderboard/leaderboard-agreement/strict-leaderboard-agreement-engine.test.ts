import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictLeaderboardAgreementEngine } from "./strict-leaderboard-agreement-engine.js";
import { newStrictLeaderboardAgreement } from "./strict-leaderboard-agreement.js";

test("StrictLeaderboardAgreementEngine keeps results within bounds", () => {
  const engine = defaultStrictLeaderboardAgreementEngine();
  const item = newStrictLeaderboardAgreement("code-156", "label-642");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
