import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryOptOutClaimEngine } from "./primary-opt-out-claim-engine.js";
import { newPrimaryOptOutClaim } from "./primary-opt-out-claim.js";

test("PrimaryOptOutClaimEngine keeps results within bounds", () => {
  const engine = defaultPrimaryOptOutClaimEngine(flags.newRegistry());
  const item = newPrimaryOptOutClaim("code-184", "label-452");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
