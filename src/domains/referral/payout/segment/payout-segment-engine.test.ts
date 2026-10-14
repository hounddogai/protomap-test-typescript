import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPayoutSegmentEngine } from "./payout-segment-engine.js";
import { newPayoutSegment } from "./payout-segment.js";

test("PayoutSegmentEngine keeps results within bounds", () => {
  const engine = defaultPayoutSegmentEngine(flags.newRegistry());
  const item = newPayoutSegment("code-901", "label-555");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
