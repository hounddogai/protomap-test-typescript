import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveDoubleOptInExceptionEngine } from "./adaptive-double-opt-in-exception-engine.js";
import { newAdaptiveDoubleOptInException } from "./adaptive-double-opt-in-exception.js";

test("AdaptiveDoubleOptInExceptionEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveDoubleOptInExceptionEngine(flags.newRegistry());
  const item = newAdaptiveDoubleOptInException("code-509", "name-921");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
