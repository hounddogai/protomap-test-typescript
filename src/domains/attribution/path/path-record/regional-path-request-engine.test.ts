import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRegionalPathRequestEngine } from "./regional-path-request-engine.js";
import { newRegionalPathRequest } from "./regional-path-request.js";

test("RegionalPathRequestEngine keeps results within bounds", () => {
  const engine = defaultRegionalPathRequestEngine(flags.newRegistry());
  const item = newRegionalPathRequest("code-190", "name-498");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
