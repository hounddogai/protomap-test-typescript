import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalSenderScoreEngine } from "./regional-sender-score-engine.js";
import { newRegionalSenderScore } from "./regional-sender-score.js";

test("RegionalSenderScoreEngine keeps results within bounds", () => {
  const engine = defaultRegionalSenderScoreEngine(flags.newRegistry());
  const item = newRegionalSenderScore("code-175", "name-811");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
