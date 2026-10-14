import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCsatMilestoneEngine } from "./csat-milestone-engine.js";
import { newCsatMilestone } from "./csat-milestone.js";

test("CsatMilestoneEngine keeps results within bounds", () => {
  const engine = defaultCsatMilestoneEngine(flags.newRegistry());
  const item = newCsatMilestone("code-978", "title-208");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
