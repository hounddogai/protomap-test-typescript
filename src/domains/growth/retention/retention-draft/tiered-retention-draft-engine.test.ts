import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultTieredRetentionDraftEngine } from "./tiered-retention-draft-engine.js";
import { newTieredRetentionDraft } from "./tiered-retention-draft.js";

test("TieredRetentionDraftEngine keeps results within bounds", () => {
  const engine = defaultTieredRetentionDraftEngine(flags.newRegistry());
  const item = newTieredRetentionDraft("code-252", "name-861");
  const result = engine.price(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
