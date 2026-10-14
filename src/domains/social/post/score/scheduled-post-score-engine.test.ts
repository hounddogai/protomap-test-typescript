import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledPostScoreEngine } from "./scheduled-post-score-engine.js";
import { newScheduledPostScore } from "./scheduled-post-score.js";

test("ScheduledPostScoreEngine keeps results within bounds", () => {
  const engine = defaultScheduledPostScoreEngine(flags.newRegistry());
  const item = newScheduledPostScore("code-320", "title-815");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
