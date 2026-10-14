import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingInsightSnapshotEngine } from "./rolling-insight-snapshot-engine.js";
import { newRollingInsightSnapshot } from "./rolling-insight-snapshot.js";

test("RollingInsightSnapshotEngine keeps results within bounds", () => {
  const engine = defaultRollingInsightSnapshotEngine(flags.newRegistry());
  const item = newRollingInsightSnapshot("code-166", "name-787");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
