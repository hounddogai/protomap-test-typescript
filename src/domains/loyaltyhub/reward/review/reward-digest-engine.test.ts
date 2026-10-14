import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRewardDigestEngine } from "./reward-digest-engine.js";
import { newRewardDigest } from "./reward-digest.js";

test("RewardDigestEngine keeps results within bounds", () => {
  const engine = defaultRewardDigestEngine(flags.newRegistry());
  const item = newRewardDigest("code-246", "title-834");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
