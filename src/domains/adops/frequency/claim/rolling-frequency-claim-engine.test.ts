import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingFrequencyClaimEngine } from "./rolling-frequency-claim-engine.js";
import { newRollingFrequencyClaim } from "./rolling-frequency-claim.js";

test("RollingFrequencyClaimEngine keeps results within bounds", () => {
  const engine = defaultRollingFrequencyClaimEngine(flags.newRegistry());
  const item = newRollingFrequencyClaim("code-935", "name-694");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
