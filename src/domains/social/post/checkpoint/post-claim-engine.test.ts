import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostClaimEngine } from "./post-claim-engine.js";
import { newPostClaim } from "./post-claim.js";

test("PostClaimEngine keeps results within bounds", () => {
  const engine = defaultPostClaimEngine(flags.newRegistry());
  const item = newPostClaim("code-308", "label-16");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
