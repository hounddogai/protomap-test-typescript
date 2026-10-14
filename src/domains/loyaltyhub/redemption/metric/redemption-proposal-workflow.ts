import * as clock from "../../../../kit/clock.js";
import * as flags from "../../../../kit/flags.js";
import { RedemptionProposalEngine, defaultRedemptionProposalEngine } from "./redemption-proposal-engine.js";
import { RedemptionProposalValidator, defaultRedemptionProposalValidator } from "./redemption-proposal-rules.js";
import { RedemptionProposalStore } from "./redemption-proposal-store.js";

/** Moves redemption proposals through their life cycle and keeps a journal of what it did. */
export class RedemptionProposalService {
  store: RedemptionProposalStore;
  validator: RedemptionProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: RedemptionProposalEngine;

  constructor(
    store: RedemptionProposalStore,
    validator: RedemptionProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: RedemptionProposalEngine,
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
    this.engine = engine;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  open(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  estimate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`redemption proposal ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.endsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newRedemptionProposalService(store: RedemptionProposalStore, clockValue: clock.Clock, flagsValue: flags.Registry): RedemptionProposalService {
  return new RedemptionProposalService(
    store,
    defaultRedemptionProposalValidator(),
    clockValue,
    [],
    defaultRedemptionProposalEngine(flagsValue),
  );
}
