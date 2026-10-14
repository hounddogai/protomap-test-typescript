import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryComplaintMappingEngine } from "./primary-complaint-mapping-engine.js";
import { newPrimaryComplaintMapping } from "./primary-complaint-mapping.js";

test("PrimaryComplaintMappingEngine keeps results within bounds", () => {
  const engine = defaultPrimaryComplaintMappingEngine();
  const item = newPrimaryComplaintMapping("code-121", "name-880");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
