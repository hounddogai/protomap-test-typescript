import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultWindowMappingEngine } from "./window-mapping-engine.js";
import { newWindowMapping } from "./window-mapping.js";

test("WindowMappingEngine keeps results within bounds", () => {
  const engine = defaultWindowMappingEngine();
  const item = newWindowMapping("code-378", "name-100");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
