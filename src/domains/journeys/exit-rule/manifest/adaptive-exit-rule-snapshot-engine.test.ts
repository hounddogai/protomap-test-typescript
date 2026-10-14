import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveExitRuleSnapshotEngine } from "./adaptive-exit-rule-snapshot-engine.js";
import { newAdaptiveExitRuleSnapshot } from "./adaptive-exit-rule-snapshot.js";

test("AdaptiveExitRuleSnapshotEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveExitRuleSnapshotEngine(flags.newRegistry());
  const item = newAdaptiveExitRuleSnapshot("code-417", "label-588");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
