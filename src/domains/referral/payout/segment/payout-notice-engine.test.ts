import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPayoutNoticeEngine } from "./payout-notice-engine.js";
import { newPayoutNotice } from "./payout-notice.js";

test("PayoutNoticeEngine keeps results within bounds", () => {
  const engine = defaultPayoutNoticeEngine(flags.newRegistry());
  const item = newPayoutNotice("code-915", "label-385");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
