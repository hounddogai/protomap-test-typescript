import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacySenderEntryEngine } from "./legacy-sender-entry-engine.js";
import { newLegacySenderEntry } from "./legacy-sender-entry.js";

test("LegacySenderEntryEngine keeps results within bounds", () => {
  const engine = defaultLegacySenderEntryEngine();
  const item = newLegacySenderEntry("code-964", "title-360");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
