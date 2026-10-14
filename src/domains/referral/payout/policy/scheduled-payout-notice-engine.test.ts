import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledPayoutNoticeEngine } from "./scheduled-payout-notice-engine.js";
import { newScheduledPayoutNotice } from "./scheduled-payout-notice.js";

test("ScheduledPayoutNoticeEngine keeps results within bounds", () => {
  const engine = defaultScheduledPayoutNoticeEngine(flags.newRegistry());
  const item = newScheduledPayoutNotice("code-754", "title-267");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
