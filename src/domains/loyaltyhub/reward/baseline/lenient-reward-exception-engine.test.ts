import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientRewardExceptionEngine } from "./lenient-reward-exception-engine.js";
import { newLenientRewardException } from "./lenient-reward-exception.js";

test("LenientRewardExceptionEngine keeps results within bounds", () => {
  const engine = defaultLenientRewardExceptionEngine(flags.newRegistry());
  const item = newLenientRewardException("code-682", "label-646");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
