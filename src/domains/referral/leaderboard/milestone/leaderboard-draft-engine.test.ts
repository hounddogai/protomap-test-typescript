import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLeaderboardDraftEngine } from "./leaderboard-draft-engine.js";
import { newLeaderboardDraft } from "./leaderboard-draft.js";

test("LeaderboardDraftEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardDraftEngine(flags.newRegistry());
  const item = newLeaderboardDraft("code-924", "label-693");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
