import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreativeMilestoneEngine } from "./creative-milestone-engine.js";
import { newCreativeMilestone } from "./creative-milestone.js";

test("CreativeMilestoneEngine keeps results within bounds", () => {
  const engine = defaultCreativeMilestoneEngine(flags.newRegistry());
  const item = newCreativeMilestone("code-696", "name-621");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
