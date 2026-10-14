import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultInviteThresholdEngine } from "./invite-threshold-engine.js";
import { newInviteThreshold } from "./invite-threshold.js";

test("InviteThresholdEngine keeps results within bounds", () => {
  const engine = defaultInviteThresholdEngine();
  const item = newInviteThreshold("code-555", "title-439");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
