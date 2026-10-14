import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryCsatScheduleEngine } from "./primary-csat-schedule-engine.js";
import { newPrimaryCsatSchedule } from "./primary-csat-schedule.js";

test("PrimaryCsatScheduleEngine keeps results within bounds", () => {
  const engine = defaultPrimaryCsatScheduleEngine(flags.newRegistry());
  const item = newPrimaryCsatSchedule("code-200", "name-262");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
