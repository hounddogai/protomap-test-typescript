import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultAdaptiveProofDraftEngine } from "./adaptive-proof-draft-engine.js";
import { newAdaptiveProofDraft } from "./adaptive-proof-draft.js";

test("AdaptiveProofDraftEngine keeps results within bounds", () => {
  const engine = defaultAdaptiveProofDraftEngine(flags.newRegistry());
  const item = newAdaptiveProofDraft("code-766", "name-779");
  const result = engine.compute(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
