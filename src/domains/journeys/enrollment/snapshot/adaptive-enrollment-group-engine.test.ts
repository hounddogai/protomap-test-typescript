import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveEnrollmentGroupEngine } from "./adaptive-enrollment-group-engine.js";
import { newAdaptiveEnrollmentGroup } from "./adaptive-enrollment-group.js";

test("AdaptiveEnrollmentGroupEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveEnrollmentGroupEngine(flags.newRegistry());
  const item = newAdaptiveEnrollmentGroup("code-980", "label-68");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
