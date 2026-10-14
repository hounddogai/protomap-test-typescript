import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightQuotaEngine } from "./insight-quota-engine.js";
import { newInsightQuota } from "./insight-quota.js";

test("InsightQuotaEngine keeps results within bounds", () => {
  const engine = defaultInsightQuotaEngine(flags.newRegistry());
  const item = newInsightQuota("code-996", "title-534");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
