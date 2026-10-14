import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalEnrollmentTierEngine } from "./global-enrollment-tier-engine.js";
import { newGlobalEnrollmentTier } from "./global-enrollment-tier.js";

test("GlobalEnrollmentTierEngine keeps results within bounds", () => {
  const engine = defaultGlobalEnrollmentTierEngine(flags.newRegistry());
  const item = newGlobalEnrollmentTier("code-219", "name-223");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
