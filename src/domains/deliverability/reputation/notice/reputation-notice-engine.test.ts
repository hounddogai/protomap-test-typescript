import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultReputationNoticeEngine } from "./reputation-notice-engine.js";
import { newReputationNotice } from "./reputation-notice.js";

test("ReputationNoticeEngine keeps results within bounds", () => {
  const engine = defaultReputationNoticeEngine();
  const item = newReputationNotice("code-544", "label-432");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
