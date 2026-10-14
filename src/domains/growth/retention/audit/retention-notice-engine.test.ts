import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultRetentionNoticeEngine } from "./retention-notice-engine.js";
import { newRetentionNotice } from "./retention-notice.js";

test("RetentionNoticeEngine keeps results within bounds", () => {
  const engine = defaultRetentionNoticeEngine();
  const item = newRetentionNotice("code-302", "name-628");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
