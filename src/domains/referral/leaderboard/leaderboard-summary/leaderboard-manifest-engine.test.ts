import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLeaderboardManifestEngine } from "./leaderboard-manifest-engine.js";
import { newLeaderboardManifest } from "./leaderboard-manifest.js";

test("LeaderboardManifestEngine keeps results within bounds", () => {
  const engine = defaultLeaderboardManifestEngine(flags.newRegistry());
  const item = newLeaderboardManifest("code-610", "name-309");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
