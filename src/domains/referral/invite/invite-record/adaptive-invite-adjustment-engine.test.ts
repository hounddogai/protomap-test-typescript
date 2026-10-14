import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultAdaptiveInviteAdjustmentEngine } from "./adaptive-invite-adjustment-engine.js";
import { newAdaptiveInviteAdjustment } from "./adaptive-invite-adjustment.js";

test("AdaptiveInviteAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveInviteAdjustmentEngine();
  const item = newAdaptiveInviteAdjustment("code-950", "name-651");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
