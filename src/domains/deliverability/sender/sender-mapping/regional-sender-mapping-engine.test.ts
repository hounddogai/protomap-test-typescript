import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalSenderMappingEngine } from "./regional-sender-mapping-engine.js";
import { newRegionalSenderMapping } from "./regional-sender-mapping.js";

test("RegionalSenderMappingEngine keeps results within bounds", () => {
  const engine = defaultRegionalSenderMappingEngine(flags.newRegistry());
  const item = newRegionalSenderMapping("code-569", "label-347");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
