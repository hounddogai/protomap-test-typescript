import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultCappedPaywallDraftEngine } from "./capped-paywall-draft-engine.js";
import { newCappedPaywallDraft } from "./capped-paywall-draft.js";

test("CappedPaywallDraftEngine keeps results within bounds", () => {
  const engine = defaultCappedPaywallDraftEngine(flags.newRegistry());
  const item = newCappedPaywallDraft("code-410", "title-783");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
