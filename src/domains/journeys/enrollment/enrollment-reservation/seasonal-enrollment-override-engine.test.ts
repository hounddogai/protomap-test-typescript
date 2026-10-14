import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalEnrollmentOverrideEngine } from "./seasonal-enrollment-override-engine.js";
import { newSeasonalEnrollmentOverride } from "./seasonal-enrollment-override.js";

test("SeasonalEnrollmentOverrideEngine keeps results within bounds", () => {
  const engine = defaultSeasonalEnrollmentOverrideEngine(flags.newRegistry());
  const item = newSeasonalEnrollmentOverride("code-315", "label-560");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
