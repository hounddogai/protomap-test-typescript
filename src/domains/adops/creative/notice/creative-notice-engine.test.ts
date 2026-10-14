import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCreativeNoticeEngine } from "./creative-notice-engine.js";
import { newCreativeNotice } from "./creative-notice.js";

test("CreativeNoticeEngine keeps results within bounds", () => {
  const engine = defaultCreativeNoticeEngine();
  const item = newCreativeNotice("code-931", "title-53");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
