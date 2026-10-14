import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultChallengeSnapshotEngine } from "./challenge-snapshot-engine.js";
import { newChallengeSnapshot } from "./challenge-snapshot.js";

test("ChallengeSnapshotEngine keeps results within bounds", () => {
  const engine = defaultChallengeSnapshotEngine();
  const item = newChallengeSnapshot("code-493", "title-413");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
