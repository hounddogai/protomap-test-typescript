import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCreativeThresholdEngine } from "./creative-threshold-engine.js";
import { newCreativeThreshold } from "./creative-threshold.js";

test("CreativeThresholdEngine keeps results within bounds", () => {
  const engine = defaultCreativeThresholdEngine(flags.newRegistry());
  const item = newCreativeThreshold("code-97", "title-803");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
