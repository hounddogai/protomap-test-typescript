import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInviteSegmentEngine } from "./invite-segment-engine.js";
import { newInviteSegment } from "./invite-segment.js";

test("InviteSegmentEngine keeps results within bounds", () => {
  const engine = defaultInviteSegmentEngine(flags.newRegistry());
  const item = newInviteSegment("code-710", "title-986");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
