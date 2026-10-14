import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPrimaryRewardRequestEngine } from "./primary-reward-request-engine.js";
import { newPrimaryRewardRequest } from "./primary-reward-request.js";

test("PrimaryRewardRequestEngine keeps results within bounds", () => {
  const engine = defaultPrimaryRewardRequestEngine(flags.newRegistry());
  const item = newPrimaryRewardRequest("code-434", "name-937");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
