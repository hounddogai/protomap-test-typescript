import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationGroupEngine } from "./reputation-group-engine.js";
import { newReputationGroup } from "./reputation-group.js";

test("ReputationGroupEngine keeps results within bounds", () => {
  const engine = defaultReputationGroupEngine(flags.newRegistry());
  const item = newReputationGroup("code-287", "label-385");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
