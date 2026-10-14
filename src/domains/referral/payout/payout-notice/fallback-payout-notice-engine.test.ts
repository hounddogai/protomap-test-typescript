import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackPayoutNoticeEngine } from "./fallback-payout-notice-engine.js";
import { newFallbackPayoutNotice } from "./fallback-payout-notice.js";

test("FallbackPayoutNoticeEngine keeps results within bounds", () => {
  const engine = defaultFallbackPayoutNoticeEngine(flags.newRegistry());
  const item = newFallbackPayoutNotice("code-712", "name-565");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
