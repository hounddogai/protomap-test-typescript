import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedPathSnapshotEngine } from "./capped-path-snapshot-engine.js";
import { newCappedPathSnapshot } from "./capped-path-snapshot.js";

test("CappedPathSnapshotEngine keeps results within bounds", () => {
  const engine = defaultCappedPathSnapshotEngine();
  const item = newCappedPathSnapshot("code-384", "title-712");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
