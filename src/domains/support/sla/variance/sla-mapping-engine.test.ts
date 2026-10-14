import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSlaMappingEngine } from "./sla-mapping-engine.js";
import { newSlaMapping } from "./sla-mapping.js";

test("SlaMappingEngine keeps results within bounds", () => {
  const engine = defaultSlaMappingEngine();
  const item = newSlaMapping("code-3", "name-359");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
