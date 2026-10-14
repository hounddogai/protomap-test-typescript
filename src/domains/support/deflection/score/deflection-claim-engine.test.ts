import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultDeflectionClaimEngine } from "./deflection-claim-engine.js";
import { newDeflectionClaim } from "./deflection-claim.js";

test("DeflectionClaimEngine keeps results within bounds", () => {
  const engine = defaultDeflectionClaimEngine();
  const item = newDeflectionClaim("code-925", "title-768");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
