import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryNudgeOverrideEngine } from "./primary-nudge-override-engine.js";
import { newPrimaryNudgeOverride } from "./primary-nudge-override.js";

test("PrimaryNudgeOverrideEngine keeps results within bounds", () => {
  const engine = defaultPrimaryNudgeOverrideEngine(flags.newRegistry());
  const item = newPrimaryNudgeOverride("code-22", "label-779");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
