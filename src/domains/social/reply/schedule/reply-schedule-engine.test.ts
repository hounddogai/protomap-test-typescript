import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReplyScheduleEngine } from "./reply-schedule-engine.js";
import { newReplySchedule } from "./reply-schedule.js";

test("ReplyScheduleEngine keeps results within bounds", () => {
  const engine = defaultReplyScheduleEngine();
  const item = newReplySchedule("code-342", "name-429");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
