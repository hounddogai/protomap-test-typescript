import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeProfileEngine } from "./challenge-profile-engine.js";
import { newChallengeProfile } from "./challenge-profile.js";

test("ChallengeProfileEngine keeps results within bounds", () => {
  const engine = defaultChallengeProfileEngine(flags.newRegistry());
  const item = newChallengeProfile("code-570", "title-52");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
