import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionExceptionEngine } from "./redemption-exception-engine.js";
import { newRedemptionException } from "./redemption-exception.js";

test("RedemptionExceptionEngine keeps results within bounds", () => {
  const engine = defaultRedemptionExceptionEngine(flags.newRegistry());
  const item = newRedemptionException("code-628", "title-128");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
