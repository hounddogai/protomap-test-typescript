import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedComplaintTargetEngine } from "./capped-complaint-target-engine.js";
import { newCappedComplaintTarget } from "./capped-complaint-target.js";

test("CappedComplaintTargetEngine keeps results within bounds", () => {
  const engine = defaultCappedComplaintTargetEngine(flags.newRegistry());
  const item = newCappedComplaintTarget("code-978", "name-741");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
