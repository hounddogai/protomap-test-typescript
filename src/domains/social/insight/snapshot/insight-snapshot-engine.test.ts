import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightSnapshotEngine } from "./insight-snapshot-engine.js";
import { newInsightSnapshot } from "./insight-snapshot.js";

test("InsightSnapshotEngine keeps results within bounds", () => {
  const engine = defaultInsightSnapshotEngine(flags.newRegistry());
  const item = newInsightSnapshot("code-53", "name-185");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
