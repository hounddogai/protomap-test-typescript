import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultStrictPaywallSnapshotEngine } from "./strict-paywall-snapshot-engine.js";
import { newStrictPaywallSnapshot } from "./strict-paywall-snapshot.js";

test("StrictPaywallSnapshotEngine keeps results within bounds", () => {
  const engine = defaultStrictPaywallSnapshotEngine();
  const item = newStrictPaywallSnapshot("code-565", "title-914");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
