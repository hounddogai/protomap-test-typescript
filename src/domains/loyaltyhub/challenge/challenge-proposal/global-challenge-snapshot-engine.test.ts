import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalChallengeSnapshotEngine } from "./global-challenge-snapshot-engine.js";
import { newGlobalChallengeSnapshot } from "./global-challenge-snapshot.js";

test("GlobalChallengeSnapshotEngine keeps results within bounds", () => {
  const engine = defaultGlobalChallengeSnapshotEngine(flags.newRegistry());
  const item = newGlobalChallengeSnapshot("code-54", "name-365");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
