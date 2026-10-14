import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedFunnelPreferenceEngine } from "./batched-funnel-preference-engine.js";
import { newBatchedFunnelPreference } from "./batched-funnel-preference.js";

test("BatchedFunnelPreferenceEngine keeps results within bounds", () => {
  const engine = defaultBatchedFunnelPreferenceEngine(flags.newRegistry());
  const item = newBatchedFunnelPreference("code-255", "title-473");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
