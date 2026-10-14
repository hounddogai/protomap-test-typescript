import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalPaywallSnapshotEngine } from "./regional-paywall-snapshot-engine.js";
import { newRegionalPaywallSnapshot } from "./regional-paywall-snapshot.js";

test("RegionalPaywallSnapshotEngine keeps results within bounds", () => {
  const engine = defaultRegionalPaywallSnapshotEngine(flags.newRegistry());
  const item = newRegionalPaywallSnapshot("code-84", "label-728");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
