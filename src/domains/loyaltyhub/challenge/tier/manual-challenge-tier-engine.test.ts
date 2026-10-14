import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualChallengeTierEngine } from "./manual-challenge-tier-engine.js";
import { newManualChallengeTier } from "./manual-challenge-tier.js";

test("ManualChallengeTierEngine keeps results within bounds", () => {
  const engine = defaultManualChallengeTierEngine(flags.newRegistry());
  const item = newManualChallengeTier("code-422", "label-485");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
