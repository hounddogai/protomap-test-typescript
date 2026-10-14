import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryFraudCheckRollupEngine } from "./primary-fraud-check-rollup-engine.js";
import { newPrimaryFraudCheckRollup } from "./primary-fraud-check-rollup.js";

test("PrimaryFraudCheckRollupEngine keeps results within bounds", () => {
  const engine = defaultPrimaryFraudCheckRollupEngine();
  const item = newPrimaryFraudCheckRollup("code-681", "label-440");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
