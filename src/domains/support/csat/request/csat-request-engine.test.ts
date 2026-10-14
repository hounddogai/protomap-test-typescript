import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultCsatRequestEngine } from "./csat-request-engine.js";
import { newCsatRequest } from "./csat-request.js";

test("CsatRequestEngine keeps results within bounds", () => {
  const engine = defaultCsatRequestEngine();
  const item = newCsatRequest("code-199", "label-517");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
