/**
 * The reputation record records of deliverability's reputation work, and the rules, stores, and calculations
 * around them.
 */

import * as text from "../../../../kit/text.js";

/** Where a reputation record is in its life cycle. */
export type ReputationRecordStatus = "requested" | "granted" | "revoked" | "expired";

/** One reputation record, with what the planners need to act on it. */
export class ReputationRecord {
  code: string;
  label: string;
  audienceId: string;
  weight: number;
  tags: string[];
  status: ReputationRecordStatus;

  constructor(
    code: string,
    label: string,
    audienceId: string,
    weight: number,
    tags: string[],
    status: ReputationRecordStatus,
  ) {
    this.code = code;
    this.label = label;
    this.audienceId = audienceId;
    this.weight = weight;
    this.tags = tags;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "expired":
        return true;
    }
    return false;
  }

  canMoveTo(next: ReputationRecordStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        switch (next) {
          case "revoked":
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: ReputationRecordStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`reputation record ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${this.code} [${this.label}]`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.weight;
  }

  copy(): ReputationRecord {
    return new ReputationRecord(this.code, this.label, this.audienceId, this.weight, this.tags, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a reputation record in status requested. */
export function newReputationRecord(code: string, label: string): ReputationRecord {
  return new ReputationRecord(code, label, "", 0, [], "requested");
}
