import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPaywallNoticeEngine } from "./paywall-notice-engine.js";
import { newPaywallNotice } from "./paywall-notice.js";

test("PaywallNoticeEngine keeps results within bounds", () => {
  const engine = defaultPaywallNoticeEngine(flags.newRegistry());
  const item = newPaywallNotice("code-608", "label-306");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
