import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultChallengeRecordEngine } from "./challenge-record-engine.js";
import { newChallengeRecord } from "./challenge-record.js";

test("ChallengeRecordEngine keeps results within bounds", () => {
  const engine = defaultChallengeRecordEngine(flags.newRegistry());
  const item = newChallengeRecord("code-27", "label-47");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
