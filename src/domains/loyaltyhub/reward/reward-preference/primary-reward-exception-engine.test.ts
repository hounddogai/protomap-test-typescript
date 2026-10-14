import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryRewardExceptionEngine } from "./primary-reward-exception-engine.js";
import { newPrimaryRewardException } from "./primary-reward-exception.js";

test("PrimaryRewardExceptionEngine keeps results within bounds", () => {
  const engine = defaultPrimaryRewardExceptionEngine(flags.newRegistry());
  const item = newPrimaryRewardException("code-863", "title-612");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
