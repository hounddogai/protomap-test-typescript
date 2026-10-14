import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualLevelEntryEngine } from "./manual-level-entry-engine.js";
import { newManualLevelEntry } from "./manual-level-entry.js";

test("ManualLevelEntryEngine keeps results within bounds", () => {
  const engine = defaultManualLevelEntryEngine(flags.newRegistry());
  const item = newManualLevelEntry("code-163", "label-508");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
