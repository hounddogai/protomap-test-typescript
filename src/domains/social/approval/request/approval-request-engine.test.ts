import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultApprovalRequestEngine } from "./approval-request-engine.js";
import { newApprovalRequest } from "./approval-request.js";

test("ApprovalRequestEngine keeps results within bounds", () => {
  const engine = defaultApprovalRequestEngine(flags.newRegistry());
  const item = newApprovalRequest("code-272", "name-815");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
