import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultActivationClaimEngine } from "./activation-claim-engine.js";
import { newActivationClaim } from "./activation-claim.js";

test("ActivationClaimEngine keeps results within bounds", () => {
  const engine = defaultActivationClaimEngine(flags.newRegistry());
  const item = newActivationClaim("code-401", "label-906");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
