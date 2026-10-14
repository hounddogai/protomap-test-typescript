import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualSuppressionProfileEngine } from "./manual-suppression-profile-engine.js";
import { newManualSuppressionProfile } from "./manual-suppression-profile.js";

test("ManualSuppressionProfileEngine keeps results within bounds", () => {
  const engine = defaultManualSuppressionProfileEngine();
  const item = newManualSuppressionProfile("code-145", "name-533");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
