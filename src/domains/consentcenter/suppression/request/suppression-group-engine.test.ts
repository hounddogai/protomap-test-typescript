import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultSuppressionGroupEngine } from "./suppression-group-engine.js";
import { newSuppressionGroup } from "./suppression-group.js";

test("SuppressionGroupEngine keeps results within bounds", () => {
  const engine = defaultSuppressionGroupEngine(flags.newRegistry());
  const item = newSuppressionGroup("code-317", "name-293");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
