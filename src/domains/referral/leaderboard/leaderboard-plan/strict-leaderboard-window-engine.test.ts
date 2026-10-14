import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictLeaderboardWindowEngine } from "./strict-leaderboard-window-engine.js";
import { newStrictLeaderboardWindow } from "./strict-leaderboard-window.js";

test("StrictLeaderboardWindowEngine keeps results within bounds", () => {
  const engine = defaultStrictLeaderboardWindowEngine(flags.newRegistry());
  const item = newStrictLeaderboardWindow("code-668", "label-531");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
