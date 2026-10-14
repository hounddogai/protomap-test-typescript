import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFunnelNoticeEngine } from "./funnel-notice-engine.js";
import { newFunnelNotice } from "./funnel-notice.js";

test("FunnelNoticeEngine keeps results within bounds", () => {
  const engine = defaultFunnelNoticeEngine();
  const item = newFunnelNotice("code-929", "name-853");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
