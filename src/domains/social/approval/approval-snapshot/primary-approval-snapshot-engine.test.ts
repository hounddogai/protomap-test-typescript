import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPrimaryApprovalSnapshotEngine } from "./primary-approval-snapshot-engine.js";
import { newPrimaryApprovalSnapshot } from "./primary-approval-snapshot.js";

test("PrimaryApprovalSnapshotEngine keeps results within bounds", () => {
  const engine = defaultPrimaryApprovalSnapshotEngine();
  const item = newPrimaryApprovalSnapshot("code-207", "title-304");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
