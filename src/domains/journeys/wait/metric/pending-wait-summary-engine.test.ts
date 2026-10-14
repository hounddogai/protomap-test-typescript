import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingWaitSummaryEngine } from "./pending-wait-summary-engine.js";
import { newPendingWaitSummary } from "./pending-wait-summary.js";

test("PendingWaitSummaryEngine keeps results within bounds", () => {
  const engine = defaultPendingWaitSummaryEngine(flags.newRegistry());
  const item = newPendingWaitSummary("code-411", "title-295");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
