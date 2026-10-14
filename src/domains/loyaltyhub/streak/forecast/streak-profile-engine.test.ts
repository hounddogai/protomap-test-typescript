import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakProfileEngine } from "./streak-profile-engine.js";
import { newStreakProfile } from "./streak-profile.js";

test("StreakProfileEngine keeps results within bounds", () => {
  const engine = defaultStreakProfileEngine(flags.newRegistry());
  const item = newStreakProfile("code-450", "label-921");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
