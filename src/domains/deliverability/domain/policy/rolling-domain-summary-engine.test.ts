import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingDomainSummaryEngine } from "./rolling-domain-summary-engine.js";
import { newRollingDomainSummary } from "./rolling-domain-summary.js";

test("RollingDomainSummaryEngine keeps results within bounds", () => {
  const engine = defaultRollingDomainSummaryEngine(flags.newRegistry());
  const item = newRollingDomainSummary("code-823", "title-299");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
