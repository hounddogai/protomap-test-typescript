import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSeasonalDeflectionPolicyEngine } from "./seasonal-deflection-policy-engine.js";
import { newSeasonalDeflectionPolicy } from "./seasonal-deflection-policy.js";

test("SeasonalDeflectionPolicyEngine keeps results within bounds", () => {
  const engine = defaultSeasonalDeflectionPolicyEngine(flags.newRegistry());
  const item = newSeasonalDeflectionPolicy("code-977", "title-341");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
