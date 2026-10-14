import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveInviteScheduleEngine } from "./adaptive-invite-schedule-engine.js";
import { newAdaptiveInviteSchedule } from "./adaptive-invite-schedule.js";

test("AdaptiveInviteScheduleEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveInviteScheduleEngine(flags.newRegistry());
  const item = newAdaptiveInviteSchedule("code-988", "label-216");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
