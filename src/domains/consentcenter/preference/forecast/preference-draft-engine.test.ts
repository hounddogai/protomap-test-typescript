import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPreferenceDraftEngine } from "./preference-draft-engine.js";
import { newPreferenceDraft } from "./preference-draft.js";

test("PreferenceDraftEngine keeps results within bounds", () => {
  const engine = defaultPreferenceDraftEngine(flags.newRegistry());
  const item = newPreferenceDraft("code-59", "label-362");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
