import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBounceExceptionEngine } from "./bounce-exception-engine.js";
import { newBounceException } from "./bounce-exception.js";

test("BounceExceptionEngine keeps results within bounds", () => {
  const engine = defaultBounceExceptionEngine(flags.newRegistry());
  const item = newBounceException("code-621", "label-325");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
