import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledInviteAdjustmentEngine } from "./scheduled-invite-adjustment-engine.js";
import { newScheduledInviteAdjustment } from "./scheduled-invite-adjustment.js";

test("ScheduledInviteAdjustmentEngine keeps results within bounds", () => {
  const engine = defaultScheduledInviteAdjustmentEngine(flags.newRegistry());
  const item = newScheduledInviteAdjustment("code-954", "name-221");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
