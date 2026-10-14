import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDefaultFlightEntryEngine } from "./default-flight-entry-engine.js";
import { newDefaultFlightEntry } from "./default-flight-entry.js";

test("DefaultFlightEntryEngine keeps results within bounds", () => {
  const engine = defaultDefaultFlightEntryEngine();
  const item = newDefaultFlightEntry("code-776", "title-900");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
