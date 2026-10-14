import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedFunnelAgreementEngine } from "./batched-funnel-agreement-engine.js";
import { newBatchedFunnelAgreement } from "./batched-funnel-agreement.js";

test("BatchedFunnelAgreementEngine keeps results within bounds", () => {
  const engine = defaultBatchedFunnelAgreementEngine(flags.newRegistry());
  const item = newBatchedFunnelAgreement("code-875", "title-412");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
