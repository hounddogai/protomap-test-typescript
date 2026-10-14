import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRollingApprovalDigestEngine } from "./rolling-approval-digest-engine.js";
import { newRollingApprovalDigest } from "./rolling-approval-digest.js";

test("RollingApprovalDigestEngine keeps results within bounds", () => {
  const engine = defaultRollingApprovalDigestEngine(flags.newRegistry());
  const item = newRollingApprovalDigest("code-426", "label-504");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
