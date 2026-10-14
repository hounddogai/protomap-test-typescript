import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientRewardProfileEngine } from "./lenient-reward-profile-engine.js";
import { newLenientRewardProfile } from "./lenient-reward-profile.js";

test("LenientRewardProfileEngine keeps results within bounds", () => {
  const engine = defaultLenientRewardProfileEngine(flags.newRegistry());
  const item = newLenientRewardProfile("code-969", "label-275");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
