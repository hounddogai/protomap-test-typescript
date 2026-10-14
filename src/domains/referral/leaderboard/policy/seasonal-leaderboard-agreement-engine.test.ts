import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalLeaderboardAgreementEngine } from "./seasonal-leaderboard-agreement-engine.js";
import { newSeasonalLeaderboardAgreement } from "./seasonal-leaderboard-agreement.js";

test("SeasonalLeaderboardAgreementEngine keeps results within bounds", () => {
  const engine = defaultSeasonalLeaderboardAgreementEngine(flags.newRegistry());
  const item = newSeasonalLeaderboardAgreement("code-930", "name-84");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
