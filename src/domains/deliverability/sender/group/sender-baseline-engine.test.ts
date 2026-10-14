import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderBaselineEngine } from "./sender-baseline-engine.js";
import { newSenderBaseline } from "./sender-baseline.js";

test("SenderBaselineEngine keeps results within bounds", () => {
  const engine = defaultSenderBaselineEngine(flags.newRegistry());
  const item = newSenderBaseline("code-292", "title-69");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
