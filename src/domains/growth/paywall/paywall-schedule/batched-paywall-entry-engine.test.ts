import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedPaywallEntryEngine } from "./batched-paywall-entry-engine.js";
import { newBatchedPaywallEntry } from "./batched-paywall-entry.js";

test("BatchedPaywallEntryEngine keeps results within bounds", () => {
  const engine = defaultBatchedPaywallEntryEngine(flags.newRegistry());
  const item = newBatchedPaywallEntry("code-708", "name-15");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
