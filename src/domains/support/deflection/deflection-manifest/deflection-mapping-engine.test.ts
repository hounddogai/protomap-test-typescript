import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDeflectionMappingEngine } from "./deflection-mapping-engine.js";
import { newDeflectionMapping } from "./deflection-mapping.js";

test("DeflectionMappingEngine keeps results within bounds", () => {
  const engine = defaultDeflectionMappingEngine(flags.newRegistry());
  const item = newDeflectionMapping("code-434", "title-90");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
