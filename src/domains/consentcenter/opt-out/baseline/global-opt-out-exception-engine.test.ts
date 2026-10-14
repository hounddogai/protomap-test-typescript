import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalOptOutExceptionEngine } from "./global-opt-out-exception-engine.js";
import { newGlobalOptOutException } from "./global-opt-out-exception.js";

test("GlobalOptOutExceptionEngine keeps results within bounds", () => {
  const engine = defaultGlobalOptOutExceptionEngine(flags.newRegistry());
  const item = newGlobalOptOutException("code-573", "title-492");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
