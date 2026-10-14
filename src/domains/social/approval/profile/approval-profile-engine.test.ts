import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultApprovalProfileEngine } from "./approval-profile-engine.js";
import { newApprovalProfile } from "./approval-profile.js";

test("ApprovalProfileEngine keeps results within bounds", () => {
  const engine = defaultApprovalProfileEngine();
  const item = newApprovalProfile("code-833", "label-946");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
