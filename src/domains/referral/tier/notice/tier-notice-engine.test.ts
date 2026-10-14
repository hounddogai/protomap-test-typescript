import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultTierNoticeEngine } from "./tier-notice-engine.js";
import { newTierNotice } from "./tier-notice.js";

test("TierNoticeEngine keeps results within bounds", () => {
  const engine = defaultTierNoticeEngine();
  const item = newTierNotice("code-425", "label-65");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
