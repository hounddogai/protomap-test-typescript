import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingSubscriptionManifestEngine } from "./pending-subscription-manifest-engine.js";
import { newPendingSubscriptionManifest } from "./pending-subscription-manifest.js";

test("PendingSubscriptionManifestEngine keeps results within bounds", () => {
  const engine = defaultPendingSubscriptionManifestEngine();
  const item = newPendingSubscriptionManifest("code-791", "title-621");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
