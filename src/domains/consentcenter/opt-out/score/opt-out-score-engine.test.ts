import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOptOutScoreEngine } from "./opt-out-score-engine.js";
import { newOptOutScore } from "./opt-out-score.js";

test("OptOutScoreEngine keeps results within bounds", () => {
  const engine = defaultOptOutScoreEngine();
  const item = newOptOutScore("code-237", "name-316");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
