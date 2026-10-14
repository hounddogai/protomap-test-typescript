import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLeaderboardNoticeEngine } from "./leaderboard-notice-engine.js";
import { newLeaderboardNotice } from "./leaderboard-notice.js";

test("LeaderboardNoticeEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardNoticeEngine(flags.newRegistry());
  const item = newLeaderboardNotice("code-975", "label-842");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
