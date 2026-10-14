import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingWaitMilestoneEngine } from "./pending-wait-milestone-engine.js";
import { newPendingWaitMilestone } from "./pending-wait-milestone.js";

test("PendingWaitMilestoneEngine keeps results within bounds", () => {
  const engine = defaultPendingWaitMilestoneEngine(flags.newRegistry());
  const item = newPendingWaitMilestone("code-774", "title-818");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
