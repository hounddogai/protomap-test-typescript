import * as clock from "../../../../kit/clock.js";
import {
  PrimaryEscalationBatchValidator,
  defaultPrimaryEscalationBatchValidator,
} from "./primary-escalation-batch-rules.js";
import { PrimaryEscalationBatchStore } from "./primary-escalation-batch-store.js";

/** Moves primary escalation batches through their life cycle and keeps a journal of what it did. */
export class PrimaryEscalationBatchWorkflow {
  store: PrimaryEscalationBatchStore;
  validator: PrimaryEscalationBatchValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: PrimaryEscalationBatchStore,
    validator: PrimaryEscalationBatchValidator,
    clockValue: clock.Clock,
    journal: string[],
  ) {
    this.store = store;
    this.validator = validator;
    this.clock = clockValue;
    this.journal = journal;
  }

  private note(message: string): void {
    this.journal.push(`${this.clock.now()} ${message}`);
  }

  start(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary escalation batch ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`primary escalation batch ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("stopped");
    this.store.save(item);
    this.note(`${code} is stopped: ${reason}`);
  }

  audit(cutoff: number): number {
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

export function newPrimaryEscalationBatchWorkflow(store: PrimaryEscalationBatchStore, clockValue: clock.Clock): PrimaryEscalationBatchWorkflow {
  return new PrimaryEscalationBatchWorkflow(store, defaultPrimaryEscalationBatchValidator(), clockValue, []);
}
