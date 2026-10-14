import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedSubscriptionRecordEngine } from "./capped-subscription-record-engine.js";
import { newCappedSubscriptionRecord } from "./capped-subscription-record.js";

test("CappedSubscriptionRecordEngine keeps results within bounds", () => {
  const engine = defaultCappedSubscriptionRecordEngine(flags.newRegistry());
  const item = newCappedSubscriptionRecord("code-72", "title-134");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
