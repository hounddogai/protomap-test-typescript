import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceGroupEngine } from "./preference-group-engine.js";
import { newPreferenceGroup } from "./preference-group.js";

test("PreferenceGroupEngine keeps results within bounds", () => {
  const engine = defaultPreferenceGroupEngine(flags.newRegistry());
  const item = newPreferenceGroup("code-719", "title-587");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
