import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalPlacementEntryEngine } from "./global-placement-entry-engine.js";
import { newGlobalPlacementEntry } from "./global-placement-entry.js";

test("GlobalPlacementEntryEngine keeps results within bounds", () => {
  const engine = defaultGlobalPlacementEntryEngine(flags.newRegistry());
  const item = newGlobalPlacementEntry("code-154", "title-306");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
