import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalReplyScheduleEngine } from "./regional-reply-schedule-engine.js";
import { newRegionalReplySchedule } from "./regional-reply-schedule.js";

test("RegionalReplyScheduleEngine keeps results within bounds", () => {
  const engine = defaultRegionalReplyScheduleEngine(flags.newRegistry());
  const item = newRegionalReplySchedule("code-724", "title-153");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
