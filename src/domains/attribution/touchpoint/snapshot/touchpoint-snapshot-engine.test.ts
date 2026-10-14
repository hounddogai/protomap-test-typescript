import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTouchpointSnapshotEngine } from "./touchpoint-snapshot-engine.js";
import { newTouchpointSnapshot } from "./touchpoint-snapshot.js";

test("TouchpointSnapshotEngine keeps results within bounds", () => {
  const engine = defaultTouchpointSnapshotEngine();
  const item = newTouchpointSnapshot("code-909", "name-752");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
