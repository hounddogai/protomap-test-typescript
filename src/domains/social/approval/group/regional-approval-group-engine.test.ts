import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalApprovalGroupEngine } from "./regional-approval-group-engine.js";
import { newRegionalApprovalGroup } from "./regional-approval-group.js";

test("RegionalApprovalGroupEngine keeps results within bounds", () => {
  const engine = defaultRegionalApprovalGroupEngine();
  const item = newRegionalApprovalGroup("code-882", "label-228");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
