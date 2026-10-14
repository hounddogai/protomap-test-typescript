import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultExitRuleSnapshotEngine } from "./exit-rule-snapshot-engine.js";
import { newExitRuleSnapshot } from "./exit-rule-snapshot.js";

test("ExitRuleSnapshotEngine keeps results within bounds", () => {
  const engine = defaultExitRuleSnapshotEngine();
  const item = newExitRuleSnapshot("code-815", "name-645");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
