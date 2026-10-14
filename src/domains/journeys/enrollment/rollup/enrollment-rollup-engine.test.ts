import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentRollupEngine } from "./enrollment-rollup-engine.js";
import { newEnrollmentRollup } from "./enrollment-rollup.js";

test("EnrollmentRollupEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentRollupEngine();
  const item = newEnrollmentRollup("code-524", "title-998");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
