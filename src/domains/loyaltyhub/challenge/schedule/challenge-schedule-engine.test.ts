import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeScheduleEngine } from "./challenge-schedule-engine.js";
import { newChallengeSchedule } from "./challenge-schedule.js";

test("ChallengeScheduleEngine keeps results within bounds", () => {
  const engine = defaultChallengeScheduleEngine(flags.newRegistry());
  const item = newChallengeSchedule("code-435", "label-632");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
