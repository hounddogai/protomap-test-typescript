import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultPendingBounceRecordEngine } from "./pending-bounce-record-engine.js";
import { newPendingBounceRecord } from "./pending-bounce-record.js";

test("PendingBounceRecordEngine keeps results within bounds", () => {
  const engine = defaultPendingBounceRecordEngine(flags.newRegistry());
  const item = newPendingBounceRecord("code-730", "title-849");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
