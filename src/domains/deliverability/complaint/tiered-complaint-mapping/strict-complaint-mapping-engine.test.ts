import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultStrictComplaintMappingEngine } from "./strict-complaint-mapping-engine.js";
import { newStrictComplaintMapping } from "./strict-complaint-mapping.js";

test("StrictComplaintMappingEngine keeps results within bounds", () => {
  const engine = defaultStrictComplaintMappingEngine(flags.newRegistry());
  const item = newStrictComplaintMapping("code-910", "name-268");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
