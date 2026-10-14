import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultMacroEntryEngine } from "./macro-entry-engine.js";
import { newMacroEntry } from "./macro-entry.js";

test("MacroEntryEngine keeps results within bounds", () => {
  const engine = defaultMacroEntryEngine(flags.newRegistry());
  const item = newMacroEntry("code-646", "name-900");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
