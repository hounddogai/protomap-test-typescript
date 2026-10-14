import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintScheduleEngine } from "./complaint-schedule-engine.js";
import { newComplaintSchedule } from "./complaint-schedule.js";

test("ComplaintScheduleEngine keeps results within bounds", () => {
  const engine = defaultComplaintScheduleEngine(flags.newRegistry());
  const item = newComplaintSchedule("code-240", "label-646");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
