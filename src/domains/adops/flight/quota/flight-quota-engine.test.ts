import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightQuotaEngine } from "./flight-quota-engine.js";
import { newFlightQuota } from "./flight-quota.js";

test("FlightQuotaEngine keeps results within bounds", () => {
  const engine = defaultFlightQuotaEngine(flags.newRegistry());
  const item = newFlightQuota("code-666", "name-342");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
