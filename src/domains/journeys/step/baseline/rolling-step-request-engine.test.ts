import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingStepRequestEngine } from "./rolling-step-request-engine.js";
import { newRollingStepRequest } from "./rolling-step-request.js";

test("RollingStepRequestEngine keeps results within bounds", () => {
  const engine = defaultRollingStepRequestEngine(flags.newRegistry());
  const item = newRollingStepRequest("code-674", "name-132");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
