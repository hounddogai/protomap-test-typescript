import * as clock from "../../../../kit/clock.js";
import {
  BatchedDomainTemplateValidator,
  defaultBatchedDomainTemplateValidator,
} from "./batched-domain-template-rules.js";
import { BatchedDomainTemplateStore } from "./batched-domain-template-store.js";

/** Moves batched domain templates through their life cycle and keeps a journal of what it did. */
export class BatchedDomainTemplateService {
  store: BatchedDomainTemplateStore;
  validator: BatchedDomainTemplateValidator;
  clock: clock.Clock;
  journal: string[];

  constructor(
    store: BatchedDomainTemplateStore,
    validator: BatchedDomainTemplateValidator,
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

  submit(code: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched domain template ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("warming");
    this.store.save(item);
    this.note(`${code} is warming`);
  }

  finish(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`batched domain template ${code} not found`);
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
      if (item.createdAt > cutoff) continue;
      const problems = this.validator.validate(item);
      if (problems.length === 0) continue;
      this.note(`${item.code} needs attention: ${problems.join(", ")}`);
      changed += 1;
    }
    return changed;
  }
}

export function newBatchedDomainTemplateService(store: BatchedDomainTemplateStore, clockValue: clock.Clock): BatchedDomainTemplateService {
  return new BatchedDomainTemplateService(store, defaultBatchedDomainTemplateValidator(), clockValue, []);
}
