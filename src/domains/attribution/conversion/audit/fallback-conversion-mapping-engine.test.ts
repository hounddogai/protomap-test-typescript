import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackConversionMappingEngine } from "./fallback-conversion-mapping-engine.js";
import { newFallbackConversionMapping } from "./fallback-conversion-mapping.js";

test("FallbackConversionMappingEngine keeps results within bounds", () => {
  const engine = defaultFallbackConversionMappingEngine(flags.newRegistry());
  const item = newFallbackConversionMapping("code-577", "name-438");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
