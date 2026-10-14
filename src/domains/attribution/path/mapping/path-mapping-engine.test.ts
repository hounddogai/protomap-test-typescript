import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPathMappingEngine } from "./path-mapping-engine.js";
import { newPathMapping } from "./path-mapping.js";

test("PathMappingEngine keeps results within bounds", () => {
  const engine = defaultPathMappingEngine();
  const item = newPathMapping("code-135", "title-188");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
