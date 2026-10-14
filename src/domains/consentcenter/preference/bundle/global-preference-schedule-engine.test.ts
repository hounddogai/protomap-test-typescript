import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultGlobalPreferenceScheduleEngine } from "./global-preference-schedule-engine.js";
import { newGlobalPreferenceSchedule } from "./global-preference-schedule.js";

test("GlobalPreferenceScheduleEngine keeps results within bounds", () => {
  const engine = defaultGlobalPreferenceScheduleEngine();
  const item = newGlobalPreferenceSchedule("code-843", "title-777");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
