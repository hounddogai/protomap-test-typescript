import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationProfileEngine } from "./reputation-profile-engine.js";
import { newReputationProfile } from "./reputation-profile.js";

test("ReputationProfileEngine keeps results within bounds", () => {
  const engine = defaultReputationProfileEngine(flags.newRegistry());
  const item = newReputationProfile("code-297", "label-507");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
