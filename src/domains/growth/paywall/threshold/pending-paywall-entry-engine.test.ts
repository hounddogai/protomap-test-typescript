import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingPaywallEntryEngine } from "./pending-paywall-entry-engine.js";
import { newPendingPaywallEntry } from "./pending-paywall-entry.js";

test("PendingPaywallEntryEngine keeps results within bounds", () => {
  const engine = defaultPendingPaywallEntryEngine(flags.newRegistry());
  const item = newPendingPaywallEntry("code-101", "name-868");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
