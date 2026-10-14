import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictInviteMetricEngine } from "./strict-invite-metric-engine.js";
import { newStrictInviteMetric } from "./strict-invite-metric.js";

test("StrictInviteMetricEngine keeps results within bounds", () => {
  const engine = defaultStrictInviteMetricEngine(flags.newRegistry());
  const item = newStrictInviteMetric("code-466", "name-267");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
