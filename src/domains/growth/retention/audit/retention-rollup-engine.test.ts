import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRetentionRollupEngine } from "./retention-rollup-engine.js";
import { newRetentionRollup } from "./retention-rollup.js";

test("RetentionRollupEngine keeps results within bounds", () => {
  const engine = defaultRetentionRollupEngine();
  const item = newRetentionRollup("code-745", "name-743");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
