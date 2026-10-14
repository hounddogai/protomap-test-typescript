import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSubscriptionExceptionEngine } from "./subscription-exception-engine.js";
import { newSubscriptionException } from "./subscription-exception.js";

test("SubscriptionExceptionEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionExceptionEngine(flags.newRegistry());
  const item = newSubscriptionException("code-971", "label-160");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
