import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultActivationTargetEngine } from "./default-activation-target-engine.js";
import { newDefaultActivationTarget } from "./default-activation-target.js";

test("DefaultActivationTargetEngine keeps results within bounds", () => {
  const engine = defaultDefaultActivationTargetEngine();
  const item = newDefaultActivationTarget("code-691", "label-153");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
