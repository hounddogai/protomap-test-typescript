import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultLenientSlaNoticeEngine } from "./lenient-sla-notice-engine.js";
import { newLenientSlaNotice } from "./lenient-sla-notice.js";

test("LenientSlaNoticeEngine keeps results within bounds", () => {
  const engine = defaultLenientSlaNoticeEngine();
  const item = newLenientSlaNotice("code-953", "name-453");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
