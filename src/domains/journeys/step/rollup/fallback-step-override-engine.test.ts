import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackStepOverrideEngine } from "./fallback-step-override-engine.js";
import { newFallbackStepOverride } from "./fallback-step-override.js";

test("FallbackStepOverrideEngine keeps results within bounds", () => {
  const engine = defaultFallbackStepOverrideEngine(flags.newRegistry());
  const item = newFallbackStepOverride("code-671", "label-83");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
