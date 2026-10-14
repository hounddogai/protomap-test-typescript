import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyPayoutSegmentEngine } from "./legacy-payout-segment-engine.js";
import { newLegacyPayoutSegment } from "./legacy-payout-segment.js";

test("LegacyPayoutSegmentEngine keeps results within bounds", () => {
  const engine = defaultLegacyPayoutSegmentEngine();
  const item = newLegacyPayoutSegment("code-845", "name-525");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
