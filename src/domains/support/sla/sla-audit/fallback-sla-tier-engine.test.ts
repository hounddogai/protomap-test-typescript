import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackSlaTierEngine } from "./fallback-sla-tier-engine.js";
import { newFallbackSlaTier } from "./fallback-sla-tier.js";

test("FallbackSlaTierEngine keeps results within bounds", () => {
  const engine = defaultFallbackSlaTierEngine(flags.newRegistry());
  const item = newFallbackSlaTier("code-159", "name-235");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
