import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackWaitMappingEngine } from "./fallback-wait-mapping-engine.js";
import { newFallbackWaitMapping } from "./fallback-wait-mapping.js";

test("FallbackWaitMappingEngine keeps results within bounds", () => {
  const engine = defaultFallbackWaitMappingEngine(flags.newRegistry());
  const item = newFallbackWaitMapping("code-742", "label-654");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
