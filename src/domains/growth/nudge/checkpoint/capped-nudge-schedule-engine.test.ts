import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedNudgeScheduleEngine } from "./capped-nudge-schedule-engine.js";
import { newCappedNudgeSchedule } from "./capped-nudge-schedule.js";

test("CappedNudgeScheduleEngine keeps results within bounds", () => {
  const engine = defaultCappedNudgeScheduleEngine();
  const item = newCappedNudgeSchedule("code-43", "title-898");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
