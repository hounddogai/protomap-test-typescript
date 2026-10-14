import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultModelMappingEngine } from "./model-mapping-engine.js";
import { newModelMapping } from "./model-mapping.js";

test("ModelMappingEngine keeps results within bounds", () => {
  const engine = defaultModelMappingEngine();
  const item = newModelMapping("code-280", "label-720");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
