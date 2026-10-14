import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackChallengeSnapshotEngine } from "./fallback-challenge-snapshot-engine.js";
import { newFallbackChallengeSnapshot } from "./fallback-challenge-snapshot.js";

test("FallbackChallengeSnapshotEngine keeps results within bounds", () => {
  const engine = defaultFallbackChallengeSnapshotEngine(flags.newRegistry());
  const item = newFallbackChallengeSnapshot("code-866", "label-2");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
