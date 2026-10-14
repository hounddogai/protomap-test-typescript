import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultManualOptOutQuotaEngine } from "./manual-opt-out-quota-engine.js";
import { newManualOptOutQuota } from "./manual-opt-out-quota.js";

test("ManualOptOutQuotaEngine keeps results within bounds", () => {
  const engine = defaultManualOptOutQuotaEngine(flags.newRegistry());
  const item = newManualOptOutQuota("code-983", "label-22");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
