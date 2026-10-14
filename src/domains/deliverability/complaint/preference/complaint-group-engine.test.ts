import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintGroupEngine } from "./complaint-group-engine.js";
import { newComplaintGroup } from "./complaint-group.js";

test("ComplaintGroupEngine keeps results within bounds", () => {
  const engine = defaultComplaintGroupEngine();
  const item = newComplaintGroup("code-278", "name-881");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
