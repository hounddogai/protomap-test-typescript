import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPostScoreEngine } from "./default-post-score-engine.js";
import { newDefaultPostScore } from "./default-post-score.js";

test("DefaultPostScoreEngine keeps results within bounds", () => {
  const engine = defaultDefaultPostScoreEngine(flags.newRegistry());
  const item = newDefaultPostScore("code-962", "name-316");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
