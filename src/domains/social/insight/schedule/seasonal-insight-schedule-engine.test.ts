import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalInsightScheduleEngine } from "./seasonal-insight-schedule-engine.js";
import { newSeasonalInsightSchedule } from "./seasonal-insight-schedule.js";

test("SeasonalInsightScheduleEngine keeps results within bounds", () => {
  const engine = defaultSeasonalInsightScheduleEngine(flags.newRegistry());
  const item = newSeasonalInsightSchedule("code-535", "title-585");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
