import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPathSnapshotEngine } from "./path-snapshot-engine.js";
import { newPathSnapshot } from "./path-snapshot.js";

test("PathSnapshotEngine keeps results within bounds", () => {
  const engine = defaultPathSnapshotEngine(flags.newRegistry());
  const item = newPathSnapshot("code-544", "label-620");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
