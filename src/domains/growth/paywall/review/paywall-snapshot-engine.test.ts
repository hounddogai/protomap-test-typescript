import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPaywallSnapshotEngine } from "./paywall-snapshot-engine.js";
import { newPaywallSnapshot } from "./paywall-snapshot.js";

test("PaywallSnapshotEngine keeps results within bounds", () => {
  const engine = defaultPaywallSnapshotEngine(flags.newRegistry());
  const item = newPaywallSnapshot("code-897", "label-931");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
