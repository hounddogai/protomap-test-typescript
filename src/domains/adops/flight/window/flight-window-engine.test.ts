import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultFlightWindowEngine } from "./flight-window-engine.js";
import { newFlightWindow } from "./flight-window.js";

test("FlightWindowEngine keeps results within bounds", () => {
  const engine = defaultFlightWindowEngine(flags.newRegistry());
  const item = newFlightWindow("code-604", "title-494");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
