import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPreferenceEntryEngine } from "./preference-entry-engine.js";
import { newPreferenceEntry } from "./preference-entry.js";

test("PreferenceEntryEngine keeps results within bounds", () => {
  const engine = defaultPreferenceEntryEngine();
  const item = newPreferenceEntry("code-160", "label-582");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
