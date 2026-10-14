import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultComplaintOverrideEngine } from "./complaint-override-engine.js";
import { newComplaintOverride } from "./complaint-override.js";

test("ComplaintOverrideEngine keeps results within bounds", () => {
  const engine = defaultComplaintOverrideEngine();
  const item = newComplaintOverride("code-66", "label-113");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
