import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallWindowEngine } from "./paywall-window-engine.js";
import { newPaywallWindow } from "./paywall-window.js";

test("PaywallWindowEngine keeps results within bounds", () => {
  const engine = defaultPaywallWindowEngine();
  const item = newPaywallWindow("code-49", "label-324");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
