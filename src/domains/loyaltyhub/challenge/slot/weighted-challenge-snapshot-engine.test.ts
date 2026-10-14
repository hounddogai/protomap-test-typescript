import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWeightedChallengeSnapshotEngine } from "./weighted-challenge-snapshot-engine.js";
import { newWeightedChallengeSnapshot } from "./weighted-challenge-snapshot.js";

test("WeightedChallengeSnapshotEngine keeps results within bounds", () => {
  const engine = defaultWeightedChallengeSnapshotEngine(flags.newRegistry());
  const item = newWeightedChallengeSnapshot("code-292", "name-206");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
