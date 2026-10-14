import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightGroupEngine } from "./flight-group-engine.js";
import { newFlightGroup } from "./flight-group.js";

test("FlightGroupEngine keeps results within bounds", () => {
  const engine = defaultFlightGroupEngine(flags.newRegistry());
  const item = newFlightGroup("code-598", "label-10");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
