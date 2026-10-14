import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSlaTargetEngine } from "./sla-target-engine.js";
import { newSlaTarget } from "./sla-target.js";

test("SlaTargetEngine keeps results within bounds", () => {
  const engine = defaultSlaTargetEngine(flags.newRegistry());
  const item = newSlaTarget("code-476", "name-677");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
