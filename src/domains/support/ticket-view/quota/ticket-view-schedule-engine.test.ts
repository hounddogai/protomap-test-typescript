import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTicketViewScheduleEngine } from "./ticket-view-schedule-engine.js";
import { newTicketViewSchedule } from "./ticket-view-schedule.js";

test("TicketViewScheduleEngine keeps results within bounds", () => {
  const engine = defaultTicketViewScheduleEngine(flags.newRegistry());
  const item = newTicketViewSchedule("code-759", "label-434");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
