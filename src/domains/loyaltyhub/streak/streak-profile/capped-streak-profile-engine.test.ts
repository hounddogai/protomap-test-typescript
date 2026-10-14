import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedStreakProfileEngine } from "./capped-streak-profile-engine.js";
import { newCappedStreakProfile } from "./capped-streak-profile.js";

test("CappedStreakProfileEngine keeps results within bounds", () => {
  const engine = defaultCappedStreakProfileEngine(flags.newRegistry());
  const item = newCappedStreakProfile("code-911", "label-151");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
