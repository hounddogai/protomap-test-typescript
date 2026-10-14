import assert from "node:assert/strict";
import { test } from "node:test";
import { defaultEnrollmentDraftEngine } from "./enrollment-draft-engine.js";
import { newEnrollmentDraft } from "./enrollment-draft.js";

test("EnrollmentDraftEngine keeps results within bounds", () => {
  const engine = defaultEnrollmentDraftEngine();
  const item = newEnrollmentDraft("code-519", "label-842");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
