import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingComplaintMappingEngine } from "./pending-complaint-mapping-engine.js";
import { newPendingComplaintMapping } from "./pending-complaint-mapping.js";

test("PendingComplaintMappingEngine keeps results within bounds", () => {
  const engine = defaultPendingComplaintMappingEngine(flags.newRegistry());
  const item = newPendingComplaintMapping("code-629", "name-380");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
