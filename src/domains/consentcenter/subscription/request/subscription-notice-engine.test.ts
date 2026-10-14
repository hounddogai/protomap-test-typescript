import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultSubscriptionNoticeEngine } from "./subscription-notice-engine.js";
import { newSubscriptionNotice } from "./subscription-notice.js";

test("SubscriptionNoticeEngine keeps results within bounds", () => {
  const engine = defaultSubscriptionNoticeEngine();
  const item = newSubscriptionNotice("code-804", "title-291");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
