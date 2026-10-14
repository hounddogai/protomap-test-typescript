import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyDoubleOptInProfileEngine } from "./legacy-double-opt-in-profile-engine.js";
import { newLegacyDoubleOptInProfile } from "./legacy-double-opt-in-profile.js";

test("LegacyDoubleOptInProfileEngine keeps results within bounds", () => {
  const engine = defaultLegacyDoubleOptInProfileEngine(flags.newRegistry());
  const item = newLegacyDoubleOptInProfile("code-2", "name-316");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
