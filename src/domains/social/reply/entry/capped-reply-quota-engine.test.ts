import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedReplyQuotaEngine } from "./capped-reply-quota-engine.js";
import { newCappedReplyQuota } from "./capped-reply-quota.js";

test("CappedReplyQuotaEngine keeps results within bounds", () => {
  const engine = defaultCappedReplyQuotaEngine(flags.newRegistry());
  const item = newCappedReplyQuota("code-960", "label-874");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
