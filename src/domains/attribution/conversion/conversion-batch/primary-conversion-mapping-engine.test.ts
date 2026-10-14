import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryConversionMappingEngine } from "./primary-conversion-mapping-engine.js";
import { newPrimaryConversionMapping } from "./primary-conversion-mapping.js";

test("PrimaryConversionMappingEngine keeps results within bounds", () => {
  const engine = defaultPrimaryConversionMappingEngine(flags.newRegistry());
  const item = newPrimaryConversionMapping("code-616", "label-774");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
