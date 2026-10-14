import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCappedCsatScheduleEngine } from "./capped-csat-schedule-engine.js";
import { newCappedCsatSchedule } from "./capped-csat-schedule.js";

test("CappedCsatScheduleEngine keeps results within bounds", () => {
  const engine = defaultCappedCsatScheduleEngine();
  const item = newCappedCsatSchedule("code-829", "title-742");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
