import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultBatchedFlightDraftEngine } from "./batched-flight-draft-engine.js";
import { newBatchedFlightDraft } from "./batched-flight-draft.js";

test("BatchedFlightDraftEngine keeps results within bounds", () => {
  const engine = defaultBatchedFlightDraftEngine(flags.newRegistry());
  const item = newBatchedFlightDraft("code-918", "title-478");
  const result = engine.evaluate(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
