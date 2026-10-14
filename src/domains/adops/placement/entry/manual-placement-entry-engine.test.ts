import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualPlacementEntryEngine } from "./manual-placement-entry-engine.js";
import { newManualPlacementEntry } from "./manual-placement-entry.js";

test("ManualPlacementEntryEngine keeps results within bounds", () => {
  const engine = defaultManualPlacementEntryEngine(flags.newRegistry());
  const item = newManualPlacementEntry("code-369", "title-761");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
