import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledFrequencyClaimEngine } from "./scheduled-frequency-claim-engine.js";
import { newScheduledFrequencyClaim } from "./scheduled-frequency-claim.js";

test("ScheduledFrequencyClaimEngine keeps results within bounds", () => {
  const engine = defaultScheduledFrequencyClaimEngine();
  const item = newScheduledFrequencyClaim("code-166", "label-406");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
