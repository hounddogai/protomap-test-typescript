import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallProfileEngine } from "./paywall-profile-engine.js";
import { newPaywallProfile } from "./paywall-profile.js";

test("PaywallProfileEngine keeps results within bounds", () => {
  const engine = defaultPaywallProfileEngine();
  const item = newPaywallProfile("code-454", "title-546");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
