import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFallbackPaywallReservationEngine } from "./fallback-paywall-reservation-engine.js";
import { newFallbackPaywallReservation } from "./fallback-paywall-reservation.js";

test("FallbackPaywallReservationEngine keeps results within bounds", () => {
  const engine = defaultFallbackPaywallReservationEngine(flags.newRegistry());
  const item = newFallbackPaywallReservation("code-461", "label-210");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
