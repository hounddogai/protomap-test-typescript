import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackWaitScheduleEngine } from "./fallback-wait-schedule-engine.js";
import { newFallbackWaitSchedule } from "./fallback-wait-schedule.js";

test("FallbackWaitScheduleEngine keeps results within bounds", () => {
  const engine = defaultFallbackWaitScheduleEngine(flags.newRegistry());
  const item = newFallbackWaitSchedule("code-371", "name-153");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
