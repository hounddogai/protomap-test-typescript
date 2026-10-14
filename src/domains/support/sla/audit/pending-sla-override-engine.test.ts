import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingSlaOverrideEngine } from "./pending-sla-override-engine.js";
import { newPendingSlaOverride } from "./pending-sla-override.js";

test("PendingSlaOverrideEngine keeps results within bounds", () => {
  const engine = defaultPendingSlaOverrideEngine();
  const item = newPendingSlaOverride("code-486", "name-764");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
