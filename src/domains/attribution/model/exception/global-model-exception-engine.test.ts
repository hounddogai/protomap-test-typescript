import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalModelExceptionEngine } from "./global-model-exception-engine.js";
import { newGlobalModelException } from "./global-model-exception.js";

test("GlobalModelExceptionEngine keeps results within bounds", () => {
  const engine = defaultGlobalModelExceptionEngine(flags.newRegistry());
  const item = newGlobalModelException("code-283", "title-101");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
