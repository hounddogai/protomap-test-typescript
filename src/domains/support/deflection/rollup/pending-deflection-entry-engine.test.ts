import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingDeflectionEntryEngine } from "./pending-deflection-entry-engine.js";
import { newPendingDeflectionEntry } from "./pending-deflection-entry.js";

test("PendingDeflectionEntryEngine keeps results within bounds", () => {
  const engine = defaultPendingDeflectionEntryEngine();
  const item = newPendingDeflectionEntry("code-705", "name-599");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
