import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintClaimEngine } from "./complaint-claim-engine.js";
import { newComplaintClaim } from "./complaint-claim.js";

test("ComplaintClaimEngine keeps results within bounds", () => {
  const engine = defaultComplaintClaimEngine(flags.newRegistry());
  const item = newComplaintClaim("code-370", "title-379");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
