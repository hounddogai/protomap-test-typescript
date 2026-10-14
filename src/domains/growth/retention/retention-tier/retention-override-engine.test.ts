import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRetentionOverrideEngine } from "./retention-override-engine.js";
import { newRetentionOverride } from "./retention-override.js";

test("RetentionOverrideEngine keeps results within bounds", () => {
  const engine = defaultRetentionOverrideEngine(flags.newRegistry());
  const item = newRetentionOverride("code-905", "title-43");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
