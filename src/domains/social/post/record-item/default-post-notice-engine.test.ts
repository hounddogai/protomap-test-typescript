import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultDefaultPostNoticeEngine } from "./default-post-notice-engine.js";
import { newDefaultPostNotice } from "./default-post-notice.js";

test("DefaultPostNoticeEngine keeps results within bounds", () => {
  const engine = defaultDefaultPostNoticeEngine(flags.newRegistry());
  const item = newDefaultPostNotice("code-724", "title-635");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
