import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalNudgeGroupEngine } from "./regional-nudge-group-engine.js";
import { newRegionalNudgeGroup } from "./regional-nudge-group.js";

test("RegionalNudgeGroupEngine keeps results within bounds", () => {
  const engine = defaultRegionalNudgeGroupEngine(flags.newRegistry());
  const item = newRegionalNudgeGroup("code-601", "title-960");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
