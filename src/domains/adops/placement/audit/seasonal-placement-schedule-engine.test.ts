import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalPlacementScheduleEngine } from "./seasonal-placement-schedule-engine.js";
import { newSeasonalPlacementSchedule } from "./seasonal-placement-schedule.js";

test("SeasonalPlacementScheduleEngine keeps results within bounds", () => {
  const engine = defaultSeasonalPlacementScheduleEngine(flags.newRegistry());
  const item = newSeasonalPlacementSchedule("code-675", "title-283");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
