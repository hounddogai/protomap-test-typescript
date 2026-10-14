import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultApprovalOverrideEngine } from "./approval-override-engine.js";
import { newApprovalOverride } from "./approval-override.js";

test("ApprovalOverrideEngine keeps results within bounds", () => {
  const engine = defaultApprovalOverrideEngine(flags.newRegistry());
  const item = newApprovalOverride("code-751", "title-427");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
