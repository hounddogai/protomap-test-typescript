import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyRollupEngine } from "./reply-rollup-engine.js";
import { newReplyRollup } from "./reply-rollup.js";

test("ReplyRollupEngine keeps results within bounds", () => {
  const engine = defaultReplyRollupEngine(flags.newRegistry());
  const item = newReplyRollup("code-975", "title-20");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
