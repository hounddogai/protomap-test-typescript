import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultFlightMilestoneEngine } from "./flight-milestone-engine.js";
import { newFlightMilestone } from "./flight-milestone.js";

test("FlightMilestoneEngine keeps results within bounds", () => {
  const engine = defaultFlightMilestoneEngine();
  const item = newFlightMilestone("code-129", "title-159");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
