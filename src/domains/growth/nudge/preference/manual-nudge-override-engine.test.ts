import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultManualNudgeOverrideEngine } from "./manual-nudge-override-engine.js";
import { newManualNudgeOverride } from "./manual-nudge-override.js";

test("ManualNudgeOverrideEngine keeps results within bounds", () => {
  const engine = defaultManualNudgeOverrideEngine();
  const item = newManualNudgeOverride("code-197", "label-607");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
