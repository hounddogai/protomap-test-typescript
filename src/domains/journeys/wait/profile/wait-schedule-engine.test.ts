import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWaitScheduleEngine } from "./wait-schedule-engine.js";
import { newWaitSchedule } from "./wait-schedule.js";

test("WaitScheduleEngine keeps results within bounds", () => {
  const engine = defaultWaitScheduleEngine(flags.newRegistry());
  const item = newWaitSchedule("code-697", "name-205");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
