import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredBranchNoticeEngine } from "./tiered-branch-notice-engine.js";
import { newTieredBranchNotice } from "./tiered-branch-notice.js";

test("TieredBranchNoticeEngine keeps results within bounds", () => {
  const engine = defaultTieredBranchNoticeEngine(flags.newRegistry());
  const item = newTieredBranchNotice("code-526", "title-163");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
