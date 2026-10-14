import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLegacyDeflectionClaimEngine } from "./legacy-deflection-claim-engine.js";
import { newLegacyDeflectionClaim } from "./legacy-deflection-claim.js";

test("LegacyDeflectionClaimEngine keeps results within bounds", () => {
  const engine = defaultLegacyDeflectionClaimEngine();
  const item = newLegacyDeflectionClaim("code-55", "label-351");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
