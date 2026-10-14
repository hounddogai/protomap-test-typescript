import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultInsightDraftEngine } from "./insight-draft-engine.js";
import { newInsightDraft } from "./insight-draft.js";

test("InsightDraftEngine keeps results within bounds", () => {
  const engine = defaultInsightDraftEngine(flags.newRegistry());
  const item = newInsightDraft("code-544", "label-503");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
