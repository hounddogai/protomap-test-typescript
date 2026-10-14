import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeOverrideEngine } from "./challenge-override-engine.js";
import { newChallengeOverride } from "./challenge-override.js";

test("ChallengeOverrideEngine keeps results within bounds", () => {
  const engine = defaultChallengeOverrideEngine(flags.newRegistry());
  const item = newChallengeOverride("code-334", "name-199");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
