import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultProofQuotaEngine } from "./proof-quota-engine.js";
import { newProofQuota } from "./proof-quota.js";

test("ProofQuotaEngine keeps results within bounds", () => {
  const engine = defaultProofQuotaEngine(flags.newRegistry());
  const item = newProofQuota("code-484", "name-544");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
