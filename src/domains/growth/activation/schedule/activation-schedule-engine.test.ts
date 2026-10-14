import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultActivationScheduleEngine } from "./activation-schedule-engine.js";
import { newActivationSchedule } from "./activation-schedule.js";

test("ActivationScheduleEngine keeps results within bounds", () => {
  const engine = defaultActivationScheduleEngine();
  const item = newActivationSchedule("code-884", "label-712");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
