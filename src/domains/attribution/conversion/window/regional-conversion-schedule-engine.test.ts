import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalConversionScheduleEngine } from "./regional-conversion-schedule-engine.js";
import { newRegionalConversionSchedule } from "./regional-conversion-schedule.js";

test("RegionalConversionScheduleEngine keeps results within bounds", () => {
  const engine = defaultRegionalConversionScheduleEngine(flags.newRegistry());
  const item = newRegionalConversionSchedule("code-412", "name-959");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
