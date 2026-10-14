import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultWindowClaimEngine } from "./window-claim-engine.js";
import { newWindowClaim } from "./window-claim.js";

test("WindowClaimEngine keeps results within bounds", () => {
  const engine = defaultWindowClaimEngine(flags.newRegistry());
  const item = newWindowClaim("code-180", "title-907");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
