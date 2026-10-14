import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledNudgePreferenceEngine } from "./scheduled-nudge-preference-engine.js";
import { newScheduledNudgePreference } from "./scheduled-nudge-preference.js";

test("ScheduledNudgePreferenceEngine keeps results within bounds", () => {
  const engine = defaultScheduledNudgePreferenceEngine(flags.newRegistry());
  const item = newScheduledNudgePreference("code-687", "label-339");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
