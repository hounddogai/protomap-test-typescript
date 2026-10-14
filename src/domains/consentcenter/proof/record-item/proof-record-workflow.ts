import * as clock from "../../../../kit/clock.js";
import { ProofRecordEngine, defaultProofRecordEngine } from "./proof-record-engine.js";
import { ProofRecordValidator, defaultProofRecordValidator } from "./proof-record-rules.js";
import { ProofRecordStore } from "./proof-record-store.js";

/** Moves proof records through their life cycle and keeps a journal of what it did. */
export class ProofRecordService {
  store: ProofRecordStore;
  validator: ProofRecordValidator;
  clock: clock.Clock;
  journal: string[];
  engine: ProofRecordEngine;

  constructor(
    store: ProofRecordStore,
    validator: ProofRecordValidator,
    clockValue: clock.Clock,
    journal: string[],
    engine: ProofRecordEngine,
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
      throw new Error(`proof record ${code} not found`);
    }
    this.validator.requireValid(item);
    item.moveTo("granted");
    this.store.save(item);
    this.note(`${code} is granted`);
  }

  settle(code: string, reason: string): void {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof record ${code} not found`);
    }
    if (item.isTerminal()) {
      this.note(`${code} already closed`);
      return;
    }
    item.moveTo("expired");
    this.store.save(item);
    this.note(`${code} is expired: ${reason}`);
  }

  score(code: string): number {
    const item = this.store.find(code);
    if (item === undefined) {
      throw new Error(`proof record ${code} not found`);
    }
    const result = this.engine.compute(item);
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

export function newProofRecordService(store: ProofRecordStore, clockValue: clock.Clock): ProofRecordService {
  return new ProofRecordService(store, defaultProofRecordValidator(), clockValue, [], defaultProofRecordEngine());
}
