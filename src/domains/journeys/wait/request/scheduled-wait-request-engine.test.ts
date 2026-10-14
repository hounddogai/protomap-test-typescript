import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledWaitRequestEngine } from "./scheduled-wait-request-engine.js";
import { newScheduledWaitRequest } from "./scheduled-wait-request.js";

test("ScheduledWaitRequestEngine keeps results within bounds", () => {
  const engine = defaultScheduledWaitRequestEngine(flags.newRegistry());
  const item = newScheduledWaitRequest("code-803", "label-23");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
