import * as text from "../../../../kit/text.js";

/** Where a step digest is in its life cycle. */
export type StepDigestStatus = "created" | "validated" | "published" | "retired";

/** A step digest as the step team keeps it. */
export class StepDigest {
  code: string;
  label: string;
  clicks: number;
  checksum: string;
  active: boolean;
  sequence: number;
  status: StepDigestStatus;

  constructor(
    code: string,
    label: string,
    clicks: number,
    checksum: string,
    active: boolean,
    sequence: number,
    status: StepDigestStatus,
  ) {
    this.code = code;
    this.label = label;
    this.clicks = clicks;
    this.checksum = checksum;
    this.active = active;
    this.sequence = sequence;
    this.status = status;
  }

  /** Reports whether the record can no longer change status. */
  isTerminal(): boolean {
    switch (this.status) {
      case "retired":
        return true;
    }
    return false;
  }

  canMoveTo(next: StepDigestStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
            return true;
        }
        return false;
      case "validated":
        return next === "published" || next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: StepDigestStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`step digest ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  displayLabel(): string {
    return `${"step digest"} ${this.code}`;
  }

  adjustedLoad(): number {
    return Math.round((this.sequence - this.clicks) * 100) / 100;
  }

  copy(): StepDigest {
    return new StepDigest(this.code, this.label, this.clicks, this.checksum, this.active, this.sequence, this.status);
  }

  groupKey(): string {
    return text.normalize(this.label);
  }
}

/** Starts a step digest in status created. */
export function newStepDigest(code: string, label: string): StepDigest {
  return new StepDigest(code, label, 0, "", false, 0, "created");
}
