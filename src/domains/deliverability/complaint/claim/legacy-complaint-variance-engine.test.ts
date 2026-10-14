import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyComplaintVarianceEngine } from "./legacy-complaint-variance-engine.js";
import { newLegacyComplaintVariance } from "./legacy-complaint-variance.js";

test("LegacyComplaintVarianceEngine keeps results within bounds", () => {
  const engine = defaultLegacyComplaintVarianceEngine();
  const item = newLegacyComplaintVariance("code-603", "title-178");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
