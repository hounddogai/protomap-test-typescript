import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictCsatPolicyEngine } from "./strict-csat-policy-engine.js";
import { newStrictCsatPolicy } from "./strict-csat-policy.js";

test("StrictCsatPolicyEngine keeps results within bounds", () => {
  const engine = defaultStrictCsatPolicyEngine(flags.newRegistry());
  const item = newStrictCsatPolicy("code-745", "label-220");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
