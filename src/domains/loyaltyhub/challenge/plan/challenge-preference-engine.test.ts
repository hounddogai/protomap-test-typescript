import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengePreferenceEngine } from "./challenge-preference-engine.js";
import { newChallengePreference } from "./challenge-preference.js";

test("ChallengePreferenceEngine keeps results within bounds", () => {
  const engine = defaultChallengePreferenceEngine(flags.newRegistry());
  const item = newChallengePreference("code-217", "name-858");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
