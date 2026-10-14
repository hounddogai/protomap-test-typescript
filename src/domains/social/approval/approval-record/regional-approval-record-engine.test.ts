import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRegionalApprovalRecordEngine } from "./regional-approval-record-engine.js";
import { newRegionalApprovalRecord } from "./regional-approval-record.js";

test("RegionalApprovalRecordEngine keeps results within bounds", () => {
  const engine = defaultRegionalApprovalRecordEngine();
  const item = newRegionalApprovalRecord("code-354", "title-598");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
