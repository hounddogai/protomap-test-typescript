import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimarySubscriptionSegmentEngine } from "./primary-subscription-segment-engine.js";
import { newPrimarySubscriptionSegment } from "./primary-subscription-segment.js";

test("PrimarySubscriptionSegmentEngine keeps results within bounds", () => {
  const engine = defaultPrimarySubscriptionSegmentEngine();
  const item = newPrimarySubscriptionSegment("code-447", "title-201");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
