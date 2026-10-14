import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreditSegmentEngine } from "./credit-segment-engine.js";
import { newCreditSegment } from "./credit-segment.js";

test("CreditSegmentEngine keeps results within bounds", () => {
  const engine = defaultCreditSegmentEngine(flags.newRegistry());
  const item = newCreditSegment("code-553", "title-428");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
