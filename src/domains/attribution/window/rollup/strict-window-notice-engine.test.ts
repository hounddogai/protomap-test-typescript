import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictWindowNoticeEngine } from "./strict-window-notice-engine.js";
import { newStrictWindowNotice } from "./strict-window-notice.js";

test("StrictWindowNoticeEngine keeps results within bounds", () => {
  const engine = defaultStrictWindowNoticeEngine(flags.newRegistry());
  const item = newStrictWindowNotice("code-261", "label-672");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
