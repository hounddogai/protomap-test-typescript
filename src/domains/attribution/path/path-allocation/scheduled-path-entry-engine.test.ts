import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledPathEntryEngine } from "./scheduled-path-entry-engine.js";
import { newScheduledPathEntry } from "./scheduled-path-entry.js";

test("ScheduledPathEntryEngine keeps results within bounds", () => {
  const engine = defaultScheduledPathEntryEngine();
  const item = newScheduledPathEntry("code-703", "name-403");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
