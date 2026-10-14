import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualSubscriptionSnapshotEngine } from "./manual-subscription-snapshot-engine.js";
import { newManualSubscriptionSnapshot } from "./manual-subscription-snapshot.js";

test("ManualSubscriptionSnapshotEngine keeps results within bounds", () => {
  const engine = defaultManualSubscriptionSnapshotEngine();
  const item = newManualSubscriptionSnapshot("code-179", "title-223");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
