import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryDomainScheduleEngine } from "./primary-domain-schedule-engine.js";
import { newPrimaryDomainSchedule } from "./primary-domain-schedule.js";

test("PrimaryDomainScheduleEngine keeps results within bounds", () => {
  const engine = defaultPrimaryDomainScheduleEngine(flags.newRegistry());
  const item = newPrimaryDomainSchedule("code-831", "title-374");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
