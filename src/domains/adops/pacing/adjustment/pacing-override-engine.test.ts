import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingOverrideEngine } from "./pacing-override-engine.js";
import { newPacingOverride } from "./pacing-override.js";

test("PacingOverrideEngine keeps results within bounds", () => {
  const engine = defaultPacingOverrideEngine(flags.newRegistry());
  const item = newPacingOverride("code-343", "title-61");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
