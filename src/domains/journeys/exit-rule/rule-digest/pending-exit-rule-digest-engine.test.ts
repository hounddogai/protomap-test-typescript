import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingExitRuleDigestEngine } from "./pending-exit-rule-digest-engine.js";
import { newPendingExitRuleDigest } from "./pending-exit-rule-digest.js";

test("PendingExitRuleDigestEngine keeps results within bounds", () => {
  const engine = defaultPendingExitRuleDigestEngine();
  const item = newPendingExitRuleDigest("code-925", "title-531");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
