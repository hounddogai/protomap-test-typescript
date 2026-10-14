import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredEnrollmentProfileEngine } from "./tiered-enrollment-profile-engine.js";
import { newTieredEnrollmentProfile } from "./tiered-enrollment-profile.js";

test("TieredEnrollmentProfileEngine keeps results within bounds", () => {
  const engine = defaultTieredEnrollmentProfileEngine(flags.newRegistry());
  const item = newTieredEnrollmentProfile("code-664", "label-583");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
