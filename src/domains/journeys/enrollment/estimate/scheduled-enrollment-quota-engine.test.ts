import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultScheduledEnrollmentQuotaEngine } from "./scheduled-enrollment-quota-engine.js";
import { newScheduledEnrollmentQuota } from "./scheduled-enrollment-quota.js";

test("ScheduledEnrollmentQuotaEngine keeps results within bounds", () => {
  const engine = defaultScheduledEnrollmentQuotaEngine(flags.newRegistry());
  const item = newScheduledEnrollmentQuota("code-79", "title-794");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
