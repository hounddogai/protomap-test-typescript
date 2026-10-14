import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReputationRecordEngine } from "./reputation-record-engine.js";
import { newReputationRecord } from "./reputation-record.js";

test("ReputationRecordEngine keeps results within bounds", () => {
  const engine = defaultReputationRecordEngine(flags.newRegistry());
  const item = newReputationRecord("code-427", "label-979");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
