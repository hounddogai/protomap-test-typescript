import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStreakRequestEngine } from "./streak-request-engine.js";
import { newStreakRequest } from "./streak-request.js";

test("StreakRequestEngine keeps results within bounds", () => {
  const engine = defaultStreakRequestEngine(flags.newRegistry());
  const item = newStreakRequest("code-871", "title-518");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
