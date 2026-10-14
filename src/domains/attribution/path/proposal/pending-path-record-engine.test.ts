import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingPathRecordEngine } from "./pending-path-record-engine.js";
import { newPendingPathRecord } from "./pending-path-record.js";

test("PendingPathRecordEngine keeps results within bounds", () => {
  const engine = defaultPendingPathRecordEngine(flags.newRegistry());
  const item = newPendingPathRecord("code-820", "label-958");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
