import * as clock from "../../../../kit/clock.js";
import { DomainSummaryEngine, defaultDomainSummaryEngine } from "./domain-summary-engine.js";
import { DomainSummaryValidator, defaultDomainSummaryValidator } from "./domain-summary-rules.js";
import { DomainSummaryStore } from "./domain-summary-store.js";

/** Moves domain summaries through their life cycle and keeps a journal of what it did. */
export class DomainSummaryWorkflow {
  store: DomainSummaryStore;
  validator: DomainSummaryValidator;
  clock: clock.Clock;
  journal: string[];
  engine: DomainSummaryEngine;

  constructor(
    store: DomainSummaryStore,
    validator: DomainSummaryValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: DomainSummaryEngine,
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
      throw new Error(`domain summary ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("queued");
    this.store.save(item);
    this.note(`${code} is queued`);
  }

  complete(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`domain summary ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("failed");
    this.store.save(item);
    this.note(`${code} is failed: ${reason}`);
  }

  evaluate(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`domain summary ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      if (item.expiresAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newDomainSummaryWorkflow(store: DomainSummaryStore, clockValue: clock.Clock): DomainSummaryWorkflow {
  return new DomainSummaryWorkflow(
    store,
    defaultDomainSummaryValidator(),
    clockValue,
    [],
    defaultDomainSummaryEngine(),
  );
}
