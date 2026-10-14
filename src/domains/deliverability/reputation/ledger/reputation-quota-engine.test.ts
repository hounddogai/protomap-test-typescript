import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationQuotaEngine } from "./reputation-quota-engine.js";
import { newReputationQuota } from "./reputation-quota.js";

test("ReputationQuotaEngine keeps results within bounds", () => {
  const engine = defaultReputationQuotaEngine(flags.newRegistry());
  const item = newReputationQuota("code-83", "name-634");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
