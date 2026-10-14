import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDoubleOptInExceptionEngine } from "./double-opt-in-exception-engine.js";
import { newDoubleOptInException } from "./double-opt-in-exception.js";

test("DoubleOptInExceptionEngine keeps results within bounds", () => {
  const engine = defaultDoubleOptInExceptionEngine(flags.newRegistry());
  const item = newDoubleOptInException("code-721", "name-728");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
