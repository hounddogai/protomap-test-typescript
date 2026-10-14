import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultOptOutEntryEngine } from "./opt-out-entry-engine.js";
import { newOptOutEntry } from "./opt-out-entry.js";

test("OptOutEntryEngine keeps results within bounds", () => {
  const engine = defaultOptOutEntryEngine();
  const item = newOptOutEntry("code-329", "name-515");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
