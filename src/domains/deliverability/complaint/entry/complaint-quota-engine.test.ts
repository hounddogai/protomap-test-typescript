import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultComplaintQuotaEngine } from "./complaint-quota-engine.js";
import { newComplaintQuota } from "./complaint-quota.js";

test("ComplaintQuotaEngine keeps results within bounds", () => {
  const engine = defaultComplaintQuotaEngine(flags.newRegistry());
  const item = newComplaintQuota("code-266", "name-865");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
