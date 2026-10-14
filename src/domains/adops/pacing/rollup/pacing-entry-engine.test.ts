import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingEntryEngine } from "./pacing-entry-engine.js";
import { newPacingEntry } from "./pacing-entry.js";

test("PacingEntryEngine keeps results within bounds", () => {
  const engine = defaultPacingEntryEngine(flags.newRegistry());
  const item = newPacingEntry("code-831", "label-572");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
