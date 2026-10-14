import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedInviteNoticeEngine } from "./batched-invite-notice-engine.js";
import { newBatchedInviteNotice } from "./batched-invite-notice.js";

test("BatchedInviteNoticeEngine keeps results within bounds", () => {
  const engine = defaultBatchedInviteNoticeEngine(flags.newRegistry());
  const item = newBatchedInviteNotice("code-748", "name-649");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
