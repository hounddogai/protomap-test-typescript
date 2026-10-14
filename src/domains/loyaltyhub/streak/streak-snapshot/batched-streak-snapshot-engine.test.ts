import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedStreakSnapshotEngine } from "./batched-streak-snapshot-engine.js";
import { newBatchedStreakSnapshot } from "./batched-streak-snapshot.js";

test("BatchedStreakSnapshotEngine keeps results within bounds", () => {
  const engine = defaultBatchedStreakSnapshotEngine(flags.newRegistry());
  const item = newBatchedStreakSnapshot("code-709", "title-390");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
