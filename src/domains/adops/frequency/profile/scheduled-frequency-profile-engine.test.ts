import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledFrequencyProfileEngine } from "./scheduled-frequency-profile-engine.js";
import { newScheduledFrequencyProfile } from "./scheduled-frequency-profile.js";

test("ScheduledFrequencyProfileEngine keeps results within bounds", () => {
  const engine = defaultScheduledFrequencyProfileEngine(flags.newRegistry());
  const item = newScheduledFrequencyProfile("code-870", "title-753");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
