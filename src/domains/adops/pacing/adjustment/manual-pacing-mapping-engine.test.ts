import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualPacingMappingEngine } from "./manual-pacing-mapping-engine.js";
import { newManualPacingMapping } from "./manual-pacing-mapping.js";

test("ManualPacingMappingEngine keeps results within bounds", () => {
  const engine = defaultManualPacingMappingEngine();
  const item = newManualPacingMapping("code-949", "label-638");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
