import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightAuditEngine } from "./flight-audit-engine.js";
import { newFlightAudit } from "./flight-audit.js";

test("FlightAuditEngine keeps results within bounds", () => {
  const engine = defaultFlightAuditEngine(flags.newRegistry());
  const item = newFlightAudit("code-85", "label-295");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
