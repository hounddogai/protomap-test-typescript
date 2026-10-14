import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentMappingEngine } from "./enrollment-mapping-engine.js";
import { newEnrollmentMapping } from "./enrollment-mapping.js";

test("EnrollmentMappingEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentMappingEngine();
  const item = newEnrollmentMapping("code-221", "title-213");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
