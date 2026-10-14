import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalInsightGroupEngine } from "./regional-insight-group-engine.js";
import { newRegionalInsightGroup } from "./regional-insight-group.js";

test("RegionalInsightGroupEngine keeps results within bounds", () => {
  const engine = defaultRegionalInsightGroupEngine(flags.newRegistry());
  const item = newRegionalInsightGroup("code-779", "label-134");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
