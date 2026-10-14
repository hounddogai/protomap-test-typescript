import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedLeaderboardNoticeEngine } from "./capped-leaderboard-notice-engine.js";
import { newCappedLeaderboardNotice } from "./capped-leaderboard-notice.js";

test("CappedLeaderboardNoticeEngine keeps results within bounds", () => {
  const engine = defaultCappedLeaderboardNoticeEngine(flags.newRegistry());
  const item = newCappedLeaderboardNotice("code-448", "label-446");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
