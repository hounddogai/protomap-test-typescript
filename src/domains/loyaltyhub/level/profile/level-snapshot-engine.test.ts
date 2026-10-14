import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLevelSnapshotEngine } from "./level-snapshot-engine.js";
import { newLevelSnapshot } from "./level-snapshot.js";

test("LevelSnapshotEngine keeps results within bounds", () => {
  const engine = defaultLevelSnapshotEngine();
  const item = newLevelSnapshot("code-683", "title-70");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
