import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalModelGroupEngine } from "./regional-model-group-engine.js";
import { newRegionalModelGroup } from "./regional-model-group.js";

test("RegionalModelGroupEngine keeps results within bounds", () => {
  const engine = defaultRegionalModelGroupEngine(flags.newRegistry());
  const item = newRegionalModelGroup("code-843", "title-339");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
