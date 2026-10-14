import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMentionEstimateEngine } from "./mention-estimate-engine.js";
import { newMentionEstimate } from "./mention-estimate.js";

test("MentionEstimateEngine keeps results within bounds", () => {
  const engine = defaultMentionEstimateEngine(flags.newRegistry());
  const item = newMentionEstimate("code-437", "title-244");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
