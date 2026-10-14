import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedFlightGroupEngine } from "./capped-flight-group-engine.js";
import { newCappedFlightGroup } from "./capped-flight-group.js";

test("CappedFlightGroupEngine keeps results within bounds", () => {
  const engine = defaultCappedFlightGroupEngine(flags.newRegistry());
  const item = newCappedFlightGroup("code-377", "title-818");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
