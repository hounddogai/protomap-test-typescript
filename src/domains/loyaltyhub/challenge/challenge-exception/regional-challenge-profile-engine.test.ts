import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalChallengeProfileEngine } from "./regional-challenge-profile-engine.js";
import { newRegionalChallengeProfile } from "./regional-challenge-profile.js";

test("RegionalChallengeProfileEngine keeps results within bounds", () => {
  const engine = defaultRegionalChallengeProfileEngine(flags.newRegistry());
  const item = newRegionalChallengeProfile("code-538", "label-726");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
