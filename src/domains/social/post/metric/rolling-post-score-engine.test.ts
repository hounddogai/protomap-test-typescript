import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRollingPostScoreEngine } from "./rolling-post-score-engine.js";
import { newRollingPostScore } from "./rolling-post-score.js";

test("RollingPostScoreEngine keeps results within bounds", () => {
  const engine = defaultRollingPostScoreEngine();
  const item = newRollingPostScore("code-155", "title-748");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
