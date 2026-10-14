import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledChallengeTierEngine } from "./scheduled-challenge-tier-engine.js";
import { newScheduledChallengeTier } from "./scheduled-challenge-tier.js";

test("ScheduledChallengeTierEngine keeps results within bounds", () => {
  const engine = defaultScheduledChallengeTierEngine(flags.newRegistry());
  const item = newScheduledChallengeTier("code-677", "label-602");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
