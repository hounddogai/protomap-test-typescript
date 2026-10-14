import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultPendingSuppressionRecordEngine } from "./pending-suppression-record-engine.js";
import { newPendingSuppressionRecord } from "./pending-suppression-record.js";

test("PendingSuppressionRecordEngine keeps results within bounds", () => {
  const engine = defaultPendingSuppressionRecordEngine();
  const item = newPendingSuppressionRecord("code-518", "label-817");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
