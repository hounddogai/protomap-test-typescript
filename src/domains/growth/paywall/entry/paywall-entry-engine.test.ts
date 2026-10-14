import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallEntryEngine } from "./paywall-entry-engine.js";
import { newPaywallEntry } from "./paywall-entry.js";

test("PaywallEntryEngine keeps results within bounds", () => {
  const engine = defaultPaywallEntryEngine();
  const item = newPaywallEntry("code-838", "name-593");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
