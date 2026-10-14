import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyApprovalAllocationEngine } from "./legacy-approval-allocation-engine.js";
import { newLegacyApprovalAllocation } from "./legacy-approval-allocation.js";

test("LegacyApprovalAllocationEngine keeps results within bounds", () => {
  const engine = defaultLegacyApprovalAllocationEngine(flags.newRegistry());
  const item = newLegacyApprovalAllocation("code-278", "label-772");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
