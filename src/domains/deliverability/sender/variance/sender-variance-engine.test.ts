import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderVarianceEngine } from "./sender-variance-engine.js";
import { newSenderVariance } from "./sender-variance.js";

test("SenderVarianceEngine keeps results within bounds", () => {
  const engine = defaultSenderVarianceEngine(flags.newRegistry());
  const item = newSenderVariance("code-490", "title-467");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
