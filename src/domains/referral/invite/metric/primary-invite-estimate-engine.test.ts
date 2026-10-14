import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryInviteEstimateEngine } from "./primary-invite-estimate-engine.js";
import { newPrimaryInviteEstimate } from "./primary-invite-estimate.js";

test("PrimaryInviteEstimateEngine keeps results within bounds", () => {
  const engine = defaultPrimaryInviteEstimateEngine();
  const item = newPrimaryInviteEstimate("code-989", "name-16");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
