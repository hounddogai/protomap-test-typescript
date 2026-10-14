import * as clock from "../../../../kit/clock.js";
import {
  PendingInsightAgreementEngine,
  defaultPendingInsightAgreementEngine,
} from "./pending-insight-agreement-engine.js";
import {
  PendingInsightAgreementValidator,
  defaultPendingInsightAgreementValidator,
} from "./pending-insight-agreement-rules.js";
import { PendingInsightAgreementStore } from "./pending-insight-agreement-store.js";

/** Moves pending insight agreements through their life cycle and keeps a journal of what it did. */
export class PendingInsightAgreementCoordinator {
  store: PendingInsightAgreementStore;
  validator: PendingInsightAgreementValidator;
  clock: clock.Clock;
  journal: string[];
  engine: PendingInsightAgreementEngine;

  constructor(
    store: PendingInsightAgreementStore,
    validator: PendingInsightAgreementValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: PendingInsightAgreementEngine,
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
      throw new Error(`pending insight agreement ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  close(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending insight agreement ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`pending insight agreement ${code} not found`);
    }
    const result = this.engine.price(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  scan(cutoff: number): number {
    let changed = 0;
    for (const item of this.store.list()) {
      if (item.isTerminal()) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newPendingInsightAgreementCoordinator(store: PendingInsightAgreementStore, clockValue: clock.Clock): PendingInsightAgreementCoordinator {
  return new PendingInsightAgreementCoordinator(
    store,
    defaultPendingInsightAgreementValidator(),
    clockValue,
    [],
    defaultPendingInsightAgreementEngine(),
  );
}
