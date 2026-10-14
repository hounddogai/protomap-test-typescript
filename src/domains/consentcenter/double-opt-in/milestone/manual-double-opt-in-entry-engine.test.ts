import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualDoubleOptInEntryEngine } from "./manual-double-opt-in-entry-engine.js";
import { newManualDoubleOptInEntry } from "./manual-double-opt-in-entry.js";

test("ManualDoubleOptInEntryEngine keeps results within bounds", () => {
  const engine = defaultManualDoubleOptInEntryEngine(flags.newRegistry());
  const item = newManualDoubleOptInEntry("code-100", "title-871");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
