import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientActivationScheduleEngine } from "./lenient-activation-schedule-engine.js";
import { newLenientActivationSchedule } from "./lenient-activation-schedule.js";

test("LenientActivationScheduleEngine keeps results within bounds", () => {
  const engine = defaultLenientActivationScheduleEngine();
  const item = newLenientActivationSchedule("code-928", "title-993");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
