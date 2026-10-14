import assert from "node:assert/strict";
import { test } from "node:test";
import * as flags from "../../../../kit/flags.js";
import { defaultReplyProposalEngine } from "./reply-proposal-engine.js";
import { newReplyProposal } from "./reply-proposal.js";

test("ReplyProposalEngine keeps results within bounds", () => {
  const engine = defaultReplyProposalEngine(flags.newRegistry());
  const item = newReplyProposal("code-442", "name-933");
  const result = engine.run(item);
  assert.ok(result >= engine.floor && result <= engine.ceiling, "result out of bounds");
  assert.ok(engine.trace.length >= 0, "trace");
});
