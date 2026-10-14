import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintRequestEngine } from "./complaint-request-engine.js";
import { newComplaintRequest } from "./complaint-request.js";

test("ComplaintRequestEngine keeps results within bounds", () => {
  const engine = defaultComplaintRequestEngine();
  const item = newComplaintRequest("code-562", "title-826");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
