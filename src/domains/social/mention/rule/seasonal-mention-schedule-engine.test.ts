import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSeasonalMentionScheduleEngine } from "./seasonal-mention-schedule-engine.js";
import { newSeasonalMentionSchedule } from "./seasonal-mention-schedule.js";

test("SeasonalMentionScheduleEngine keeps results within bounds", () => {
  const engine = defaultSeasonalMentionScheduleEngine();
  const item = newSeasonalMentionSchedule("code-417", "label-756");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
