import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalCsatClaimEngine } from "./regional-csat-claim-engine.js";
import { newRegionalCsatClaim } from "./regional-csat-claim.js";

test("RegionalCsatClaimEngine keeps results within bounds", () => {
  const engine = defaultRegionalCsatClaimEngine(flags.newRegistry());
  const item = newRegionalCsatClaim("code-170", "name-675");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
