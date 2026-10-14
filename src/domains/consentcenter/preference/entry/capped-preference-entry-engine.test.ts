import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedPreferenceEntryEngine } from "./capped-preference-entry-engine.js";
import { newCappedPreferenceEntry } from "./capped-preference-entry.js";

test("CappedPreferenceEntryEngine keeps results within bounds", () => {
  const engine = defaultCappedPreferenceEntryEngine(flags.newRegistry());
  const item = newCappedPreferenceEntry("code-409", "label-225");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
