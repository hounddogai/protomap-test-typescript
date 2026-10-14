import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultNudgeRequestEngine } from "./nudge-request-engine.js";
import { newNudgeRequest } from "./nudge-request.js";

test("NudgeRequestEngine keeps results within bounds", () => {
  const engine = defaultNudgeRequestEngine(flags.newRegistry());
  const item = newNudgeRequest("code-437", "name-228");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
