import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedDomainMappingEngine } from "./capped-domain-mapping-engine.js";
import { newCappedDomainMapping } from "./capped-domain-mapping.js";

test("CappedDomainMappingEngine keeps results within bounds", () => {
  const engine = defaultCappedDomainMappingEngine();
  const item = newCappedDomainMapping("code-553", "label-42");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
