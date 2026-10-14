import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationExceptionEngine } from "./reputation-exception-engine.js";
import { newReputationException } from "./reputation-exception.js";

test("ReputationExceptionEngine keeps results within bounds", () => {
  const engine = defaultReputationExceptionEngine(flags.newRegistry());
  const item = newReputationException("code-429", "label-754");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
