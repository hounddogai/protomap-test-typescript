import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeExceptionEngine } from "./challenge-exception-engine.js";
import { newChallengeException } from "./challenge-exception.js";

test("ChallengeExceptionEngine keeps results within bounds", () => {
  const engine = defaultChallengeExceptionEngine(flags.newRegistry());
  const item = newChallengeException("code-780", "label-379");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
