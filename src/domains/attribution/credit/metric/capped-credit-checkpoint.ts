import * as text from "../../../../kit/text.js";

/** Where a capped credit checkpoint is in its life cycle. */
export type CappedCreditCheckpointStatus = "requested" | "granted" | "revoked" | "expired";

/** A capped credit checkpoint as the credit team keeps it. */
export class CappedCreditCheckpoint {
  code: string;
  name: string;
  minimum: number;
  tags: string[];
  approved: boolean;
  status: CappedCreditCheckpointStatus;

  constructor(
    code: string,
    name: string,
    minimum: number,
    tags: string[],
    approved: boolean,
    status: CappedCreditCheckpointStatus,
  ) {
    this.code = code;
    this.name = name;
    this.minimum = minimum;
    this.tags = tags;
    this.approved = approved;
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

  canMoveTo(next: CappedCreditCheckpointStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted" || next === "revoked";
      case "granted":
        return next === "revoked";
      case "revoked":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: CappedCreditCheckpointStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`capped credit checkpoint ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  hasTag(tag: string): boolean {
    for (const candidate of this.tags) {
      if (text.normalize(candidate) === text.normalize(tag)) return true;
    }
    return false;
  }

  measuredValue(): number {
    return this.minimum;
  }

  copy(): CappedCreditCheckpoint {
    return new CappedCreditCheckpoint(this.code, this.name, this.minimum, this.tags, this.approved, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a capped credit checkpoint in status requested. */
export function newCappedCreditCheckpoint(code: string, name: string): CappedCreditCheckpoint {
  return new CappedCreditCheckpoint(code, name, 0, [], false, "requested");
}
