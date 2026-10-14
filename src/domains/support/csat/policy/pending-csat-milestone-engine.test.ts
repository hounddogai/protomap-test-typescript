import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingCsatMilestoneEngine } from "./pending-csat-milestone-engine.js";
import { newPendingCsatMilestone } from "./pending-csat-milestone.js";

test("PendingCsatMilestoneEngine keeps results within bounds", () => {
  const engine = defaultPendingCsatMilestoneEngine(flags.newRegistry());
  const item = newPendingCsatMilestone("code-40", "title-924");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
