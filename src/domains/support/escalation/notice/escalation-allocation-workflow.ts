import * as clock from "../../../../kit/clock.js";
import { EscalationAllocationEngine, defaultEscalationAllocationEngine } from "./escalation-allocation-engine.js";
import {
  EscalationAllocationValidator,
  defaultEscalationAllocationValidator,
} from "./escalation-allocation-rules.js";
import { EscalationAllocationStore } from "./escalation-allocation-store.js";

/** Moves escalation allocations through their life cycle and keeps a journal of what it did. */
export class EscalationAllocationManager {
  store: EscalationAllocationStore;
  validator: EscalationAllocationValidator;
  clock: clock.Clock;
  journal: string[];
  engine: EscalationAllocationEngine;

  constructor(
    store: EscalationAllocationStore,
    validator: EscalationAllocationValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: EscalationAllocationEngine,
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
      throw new Error(`escalation allocation ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("in_review");
    this.store.save(item);
    this.note(`${code} is in review`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation allocation ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("archived");
    this.store.save(item);
    this.note(`${code} is archived: ${reason}`);
  }

  quote(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`escalation allocation ${code} not found`);
    }
    const result = this.engine.run(item);
    this.note(`${code} evaluated at ${result}`);
    return result;
  }

  reviewStale(cutoff: number): number {
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

export function newEscalationAllocationManager(store: EscalationAllocationStore, clockValue: clock.Clock): EscalationAllocationManager {
  return new EscalationAllocationManager(
    store,
    defaultEscalationAllocationValidator(),
    clockValue,
    [],
    defaultEscalationAllocationEngine(),
  );
}
