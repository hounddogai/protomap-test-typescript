import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyBadgeNoticeEngine } from "./legacy-badge-notice-engine.js";
import { newLegacyBadgeNotice } from "./legacy-badge-notice.js";

test("LegacyBadgeNoticeEngine keeps results within bounds", () => {
  const engine = defaultLegacyBadgeNoticeEngine(flags.newRegistry());
  const item = newLegacyBadgeNotice("code-490", "label-890");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
