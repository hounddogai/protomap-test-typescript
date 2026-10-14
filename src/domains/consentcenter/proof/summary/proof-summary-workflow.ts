import * as clock from "../../../../kit/clock.js";
import { ProofSummaryEngine, defaultProofSummaryEngine } from "./proof-summary-engine.js";
import { ProofSummaryValidator, defaultProofSummaryValidator } from "./proof-summary-rules.js";
import { ProofSummaryStore } from "./proof-summary-store.js";

/** Moves proof summaries through their life cycle and keeps a journal of what it did. */
export class ProofSummaryCoordinator {
  store: ProofSummaryStore;
  validator: ProofSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofSummaryEngine;

  constructor(
    store: ProofSummaryStore,
    validator: ProofSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofSummaryEngine,
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

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("pending");
    this.store.save(item);
    this.note(`${code} is pending`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("closed");
    this.store.save(item);
    this.note(`${code} is closed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof summary ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.startsAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newProofSummaryCoordinator(store: ProofSummaryStore, clockValue: clock.Clock): ProofSummaryCoordinator {
  return new ProofSummaryCoordinator(
    store,
    defaultProofSummaryValidator(),
    clockValue,
    [],
    defaultProofSummaryEngine(),
  );
}
