import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLenientInviteSegmentEngine } from "./lenient-invite-segment-engine.js";
import { newLenientInviteSegment } from "./lenient-invite-segment.js";

test("LenientInviteSegmentEngine keeps results within bounds", () => {
  const engine = defaultLenientInviteSegmentEngine(flags.newRegistry());
  const item = newLenientInviteSegment("code-675", "name-870");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
