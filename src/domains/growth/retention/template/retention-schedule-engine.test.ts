import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionScheduleEngine } from "./retention-schedule-engine.js";
import { newRetentionSchedule } from "./retention-schedule.js";

test("RetentionScheduleEngine keeps results within bounds", () => {
  const engine = defaultRetentionScheduleEngine(flags.newRegistry());
  const item = newRetentionSchedule("code-667", "label-244");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
