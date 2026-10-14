import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacySuppressionVarianceEngine } from "./legacy-suppression-variance-engine.js";
import { newLegacySuppressionVariance } from "./legacy-suppression-variance.js";

test("LegacySuppressionVarianceEngine keeps results within bounds", () => {
  const engine = defaultLegacySuppressionVarianceEngine(flags.newRegistry());
  const item = newLegacySuppressionVariance("code-921", "title-417");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
