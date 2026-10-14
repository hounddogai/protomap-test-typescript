import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultBatchedFunnelNoticeEngine } from "./batched-funnel-notice-engine.js";
import { newBatchedFunnelNotice } from "./batched-funnel-notice.js";

test("BatchedFunnelNoticeEngine keeps results within bounds", () => {
  const engine = defaultBatchedFunnelNoticeEngine();
  const item = newBatchedFunnelNotice("code-49", "label-453");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
