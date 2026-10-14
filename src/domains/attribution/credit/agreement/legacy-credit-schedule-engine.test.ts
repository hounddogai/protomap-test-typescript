import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyCreditScheduleEngine } from "./legacy-credit-schedule-engine.js";
import { newLegacyCreditSchedule } from "./legacy-credit-schedule.js";

test("LegacyCreditScheduleEngine keeps results within bounds", () => {
  const engine = defaultLegacyCreditScheduleEngine(flags.newRegistry());
  const item = newLegacyCreditSchedule("code-196", "label-388");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
