import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTouchpointExceptionEngine } from "./touchpoint-exception-engine.js";
import { newTouchpointException } from "./touchpoint-exception.js";

test("TouchpointExceptionEngine keeps results within bounds", () => {
  const engine = defaultTouchpointExceptionEngine(flags.newRegistry());
  const item = newTouchpointException("code-884", "label-18");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
