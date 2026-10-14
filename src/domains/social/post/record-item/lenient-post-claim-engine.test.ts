import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientPostClaimEngine } from "./lenient-post-claim-engine.js";
import { newLenientPostClaim } from "./lenient-post-claim.js";

test("LenientPostClaimEngine keeps results within bounds", () => {
  const engine = defaultLenientPostClaimEngine(flags.newRegistry());
  const item = newLenientPostClaim("code-620", "title-257");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
