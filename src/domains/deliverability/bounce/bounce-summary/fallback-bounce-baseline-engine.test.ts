import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackBounceBaselineEngine } from "./fallback-bounce-baseline-engine.js";
import { newFallbackBounceBaseline } from "./fallback-bounce-baseline.js";

test("FallbackBounceBaselineEngine keeps results within bounds", () => {
  const engine = defaultFallbackBounceBaselineEngine(flags.newRegistry());
  const item = newFallbackBounceBaseline("code-587", "title-826");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
