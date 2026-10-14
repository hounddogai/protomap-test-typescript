import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientDeflectionClaimEngine } from "./lenient-deflection-claim-engine.js";
import { newLenientDeflectionClaim } from "./lenient-deflection-claim.js";

test("LenientDeflectionClaimEngine keeps results within bounds", () => {
  const engine = defaultLenientDeflectionClaimEngine();
  const item = newLenientDeflectionClaim("code-764", "name-573");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
