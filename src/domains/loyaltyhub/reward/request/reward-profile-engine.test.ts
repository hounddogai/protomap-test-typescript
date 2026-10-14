import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardProfileEngine } from "./reward-profile-engine.js";
import { newRewardProfile } from "./reward-profile.js";

test("RewardProfileEngine keeps results within bounds", () => {
  const engine = defaultRewardProfileEngine(flags.newRegistry());
  const item = newRewardProfile("code-568", "label-303");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
