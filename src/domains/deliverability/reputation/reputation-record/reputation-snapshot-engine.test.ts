import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReputationSnapshotEngine } from "./reputation-snapshot-engine.js";
import { newReputationSnapshot } from "./reputation-snapshot.js";

test("ReputationSnapshotEngine keeps results within bounds", () => {
  const engine = defaultReputationSnapshotEngine();
  const item = newReputationSnapshot("code-673", "title-83");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
