import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultRedemptionDraftEngine } from "./redemption-draft-engine.js";
import { newRedemptionDraft } from "./redemption-draft.js";

test("RedemptionDraftEngine keeps results within bounds", () => {
  const engine = defaultRedemptionDraftEngine(flags.newRegistry());
  const item = newRedemptionDraft("code-711", "name-93");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
