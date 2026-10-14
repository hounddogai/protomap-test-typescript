import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPaywallManifestEngine } from "./paywall-manifest-engine.js";
import { newPaywallManifest } from "./paywall-manifest.js";

test("PaywallManifestEngine keeps results within bounds", () => {
  const engine = defaultPaywallManifestEngine();
  const item = newPaywallManifest("code-978", "name-803");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
