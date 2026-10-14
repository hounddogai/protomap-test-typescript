import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingSlaTargetEngine } from "./pending-sla-target-engine.js";
import { newPendingSlaTarget } from "./pending-sla-target.js";

test("PendingSlaTargetEngine keeps results within bounds", () => {
  const engine = defaultPendingSlaTargetEngine();
  const item = newPendingSlaTarget("code-563", "label-937");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
