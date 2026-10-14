import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatScheduleEngine } from "./csat-schedule-engine.js";
import { newCsatSchedule } from "./csat-schedule.js";

test("CsatScheduleEngine keeps results within bounds", () => {
  const engine = defaultCsatScheduleEngine();
  const item = newCsatSchedule("code-563", "label-942");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
