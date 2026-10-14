import * as clock from "../../../../kit/clock.js";
import { ActivationProposalEngine, defaultActivationProposalEngine } from "./activation-proposal-engine.js";
import { ActivationProposalValidator, defaultActivationProposalValidator } from "./activation-proposal-rules.js";
import { ActivationProposalStore } from "./activation-proposal-store.js";

/** Moves activation proposals through their life cycle and keeps a journal of what it did. */
export class ActivationProposalWorkflow {
  store: ActivationProposalStore;
  validator: ActivationProposalValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ActivationProposalEngine;

  constructor(
    store: ActivationProposalStore,
    validator: ActivationProposalValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ActivationProposalEngine,
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

  advance(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation proposal ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation proposal ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`activation proposal ${code} not found`);
    }
    const result = this.engine.evaluate(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  sweep(cutoff: number): number {
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

export function newActivationProposalWorkflow(store: ActivationProposalStore, clockValue: clock.Clock): ActivationProposalWorkflow {
  return new ActivationProposalWorkflow(
    store,
    defaultActivationProposalValidator(),
    clockValue,
    [],
    defaultActivationProposalEngine(),
  );
}
