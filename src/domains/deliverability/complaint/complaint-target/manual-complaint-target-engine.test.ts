import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualComplaintTargetEngine } from "./manual-complaint-target-engine.js";
import { newManualComplaintTarget } from "./manual-complaint-target.js";

test("ManualComplaintTargetEngine keeps results within bounds", () => {
  const engine = defaultManualComplaintTargetEngine();
  const item = newManualComplaintTarget("code-326", "name-709");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
