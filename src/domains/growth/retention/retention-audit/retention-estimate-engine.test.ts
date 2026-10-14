import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionEstimateEngine } from "./retention-estimate-engine.js";
import { newRetentionEstimate } from "./retention-estimate.js";

test("RetentionEstimateEngine keeps results within bounds", () => {
  const engine = defaultRetentionEstimateEngine(flags.newRegistry());
  const item = newRetentionEstimate("code-348", "label-907");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
