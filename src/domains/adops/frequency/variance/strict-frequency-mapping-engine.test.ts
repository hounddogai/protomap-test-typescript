import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictFrequencyMappingEngine } from "./strict-frequency-mapping-engine.js";
import { newStrictFrequencyMapping } from "./strict-frequency-mapping.js";

test("StrictFrequencyMappingEngine keeps results within bounds", () => {
  const engine = defaultStrictFrequencyMappingEngine(flags.newRegistry());
  const item = newStrictFrequencyMapping("code-956", "title-811");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
