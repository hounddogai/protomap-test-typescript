import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeScheduleEngine } from "./creative-schedule-engine.js";
import { newCreativeSchedule } from "./creative-schedule.js";

test("CreativeScheduleEngine keeps results within bounds", () => {
  const engine = defaultCreativeScheduleEngine();
  const item = newCreativeSchedule("code-908", "title-88");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
