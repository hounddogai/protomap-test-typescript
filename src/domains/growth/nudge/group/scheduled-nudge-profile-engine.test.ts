import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultScheduledNudgeProfileEngine } from "./scheduled-nudge-profile-engine.js";
import { newScheduledNudgeProfile } from "./scheduled-nudge-profile.js";

test("ScheduledNudgeProfileEngine keeps results within bounds", () => {
  const engine = defaultScheduledNudgeProfileEngine();
  const item = newScheduledNudgeProfile("code-978", "label-840");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
