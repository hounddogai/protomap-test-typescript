import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatClaimEngine } from "./csat-claim-engine.js";
import { newCsatClaim } from "./csat-claim.js";

test("CsatClaimEngine keeps results within bounds", () => {
  const engine = defaultCsatClaimEngine();
  const item = newCsatClaim("code-117", "title-728");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
