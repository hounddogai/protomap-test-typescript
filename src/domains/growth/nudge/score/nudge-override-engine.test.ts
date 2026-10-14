import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultNudgeOverrideEngine } from "./nudge-override-engine.js";
import { newNudgeOverride } from "./nudge-override.js";

test("NudgeOverrideEngine keeps results within bounds", () => {
  const engine = defaultNudgeOverrideEngine();
  const item = newNudgeOverride("code-434", "title-247");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
