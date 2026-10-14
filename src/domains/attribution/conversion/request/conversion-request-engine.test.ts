import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionRequestEngine } from "./conversion-request-engine.js";
import { newConversionRequest } from "./conversion-request.js";

test("ConversionRequestEngine keeps results within bounds", () => {
  const engine = defaultConversionRequestEngine(flags.newRegistry());
  const item = newConversionRequest("code-54", "label-332");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
