import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPostMetricEngine } from "./post-metric-engine.js";
import { newPostMetric } from "./post-metric.js";

test("PostMetricEngine keeps results within bounds", () => {
  const engine = defaultPostMetricEngine(flags.newRegistry());
  const item = newPostMetric("code-65", "label-682");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
