import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultLegacyComplaintDraftEngine } from "./legacy-complaint-draft-engine.js";
import { newLegacyComplaintDraft } from "./legacy-complaint-draft.js";

test("LegacyComplaintDraftEngine keeps results within bounds", () => {
  const engine = defaultLegacyComplaintDraftEngine(flags.newRegistry());
  const item = newLegacyComplaintDraft("code-925", "title-56");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
