import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalStepOverrideEngine } from "./regional-step-override-engine.js";
import { newRegionalStepOverride } from "./regional-step-override.js";

test("RegionalStepOverrideEngine keeps results within bounds", () => {
  const engine = defaultRegionalStepOverrideEngine(flags.newRegistry());
  const item = newRegionalStepOverride("code-123", "label-711");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
