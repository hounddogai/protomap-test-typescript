import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictCsatClaimEngine } from "./strict-csat-claim-engine.js";
import { newStrictCsatClaim } from "./strict-csat-claim.js";

test("StrictCsatClaimEngine keeps results within bounds", () => {
  const engine = defaultStrictCsatClaimEngine(flags.newRegistry());
  const item = newStrictCsatClaim("code-938", "label-429");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
