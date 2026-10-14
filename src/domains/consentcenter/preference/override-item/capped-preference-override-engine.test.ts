import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedPreferenceOverrideEngine } from "./capped-preference-override-engine.js";
import { newCappedPreferenceOverride } from "./capped-preference-override.js";

test("CappedPreferenceOverrideEngine keeps results within bounds", () => {
  const engine = defaultCappedPreferenceOverrideEngine(flags.newRegistry());
  const item = newCappedPreferenceOverride("code-836", "title-287");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
