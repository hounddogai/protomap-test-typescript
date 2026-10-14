import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingFrequencyRequestEngine } from "./pending-frequency-request-engine.js";
import { newPendingFrequencyRequest } from "./pending-frequency-request.js";

test("PendingFrequencyRequestEngine keeps results within bounds", () => {
  const engine = defaultPendingFrequencyRequestEngine(flags.newRegistry());
  const item = newPendingFrequencyRequest("code-160", "label-522");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
