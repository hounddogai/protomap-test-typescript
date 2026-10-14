import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultSenderScoreEngine } from "./default-sender-score-engine.js";
import { newDefaultSenderScore } from "./default-sender-score.js";

test("DefaultSenderScoreEngine keeps results within bounds", () => {
  const engine = defaultDefaultSenderScoreEngine(flags.newRegistry());
  const item = newDefaultSenderScore("code-382", "title-126");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
