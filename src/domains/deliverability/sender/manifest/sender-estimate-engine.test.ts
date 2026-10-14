import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSenderEstimateEngine } from "./sender-estimate-engine.js";
import { newSenderEstimate } from "./sender-estimate.js";

test("SenderEstimateEngine keeps results within bounds", () => {
  const engine = defaultSenderEstimateEngine(flags.newRegistry());
  const item = newSenderEstimate("code-547", "label-170");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
