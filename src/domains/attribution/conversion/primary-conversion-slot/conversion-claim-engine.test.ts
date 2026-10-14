import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultConversionClaimEngine } from "./conversion-claim-engine.js";
import { newConversionClaim } from "./conversion-claim.js";

test("ConversionClaimEngine keeps results within bounds", () => {
  const engine = defaultConversionClaimEngine(flags.newRegistry());
  const item = newConversionClaim("code-558", "title-909");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
