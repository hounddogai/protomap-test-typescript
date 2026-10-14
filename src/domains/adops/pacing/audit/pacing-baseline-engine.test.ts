import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPacingBaselineEngine } from "./pacing-baseline-engine.js";
import { newPacingBaseline } from "./pacing-baseline.js";

test("PacingBaselineEngine keeps results within bounds", () => {
  const engine = defaultPacingBaselineEngine(flags.newRegistry());
  const item = newPacingBaseline("code-946", "title-306");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
