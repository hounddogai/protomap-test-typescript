import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingApprovalBundleEngine } from "./pending-approval-bundle-engine.js";
import { newPendingApprovalBundle } from "./pending-approval-bundle.js";

test("PendingApprovalBundleEngine keeps results within bounds", () => {
  const engine = defaultPendingApprovalBundleEngine(flags.newRegistry());
  const item = newPendingApprovalBundle("code-714", "title-347");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
