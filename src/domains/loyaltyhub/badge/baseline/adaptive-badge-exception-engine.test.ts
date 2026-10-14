import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveBadgeExceptionEngine } from "./adaptive-badge-exception-engine.js";
import { newAdaptiveBadgeException } from "./adaptive-badge-exception.js";

test("AdaptiveBadgeExceptionEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveBadgeExceptionEngine(flags.newRegistry());
  const item = newAdaptiveBadgeException("code-715", "label-100");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
