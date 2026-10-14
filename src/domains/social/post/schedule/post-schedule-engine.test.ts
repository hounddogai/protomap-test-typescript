import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPostScheduleEngine } from "./post-schedule-engine.js";
import { newPostSchedule } from "./post-schedule.js";

test("PostScheduleEngine keeps results within bounds", () => {
  const engine = defaultPostScheduleEngine();
  const item = newPostSchedule("code-761", "name-453");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
