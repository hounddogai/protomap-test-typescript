import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultGlobalReputationNoticeEngine } from "./global-reputation-notice-engine.js";
import { newGlobalReputationNotice } from "./global-reputation-notice.js";

test("GlobalReputationNoticeEngine keeps results within bounds", () => {
  const engine = defaultGlobalReputationNoticeEngine(flags.newRegistry());
  const item = newGlobalReputationNotice("code-750", "title-645");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
