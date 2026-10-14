import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalEnrollmentPolicyEngine } from "./seasonal-enrollment-policy-engine.js";
import { newSeasonalEnrollmentPolicy } from "./seasonal-enrollment-policy.js";

test("SeasonalEnrollmentPolicyEngine keeps results within bounds", () => {
  const engine = defaultSeasonalEnrollmentPolicyEngine(flags.newRegistry());
  const item = newSeasonalEnrollmentPolicy("code-280", "label-44");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
