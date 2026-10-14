import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalApprovalOverrideEngine } from "./regional-approval-override-engine.js";
import { newRegionalApprovalOverride } from "./regional-approval-override.js";

test("RegionalApprovalOverrideEngine keeps results within bounds", () => {
  const engine = defaultRegionalApprovalOverrideEngine(flags.newRegistry());
  const item = newRegionalApprovalOverride("code-659", "name-438");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
