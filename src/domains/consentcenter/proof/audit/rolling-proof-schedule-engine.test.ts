import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingProofScheduleEngine } from "./rolling-proof-schedule-engine.js";
import { newRollingProofSchedule } from "./rolling-proof-schedule.js";

test("RollingProofScheduleEngine keeps results within bounds", () => {
  const engine = defaultRollingProofScheduleEngine();
  const item = newRollingProofSchedule("code-457", "name-256");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
