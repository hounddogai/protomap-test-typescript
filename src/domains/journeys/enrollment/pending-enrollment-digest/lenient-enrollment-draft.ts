import * as text from "../../../../kit/text.js";

/** Where a lenient enrollment draft is in its life cycle. */
export type LenientEnrollmentDraftStatus = "created" | "validated" | "published" | "retired";

/** A lenient enrollment draft. Its code is unique within a tenant. */
export class LenientEnrollmentDraft {
  code: string;
  name: string;
  sequence: number;
  ratio: number;
  createdAt: number;
  status: LenientEnrollmentDraftStatus;

  constructor(
    code: string,
    name: string,
    sequence: number,
    ratio: number,
    createdAt: number,
    status: LenientEnrollmentDraftStatus,
  ) {
    this.code = code;
    this.name = name;
    this.sequence = sequence;
    this.ratio = ratio;
    this.createdAt = createdAt;
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

  canMoveTo(next: LenientEnrollmentDraftStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "published";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: LenientEnrollmentDraftStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`lenient enrollment draft ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.createdAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${"lenient enrollment draft"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round((this.sequence + this.ratio) * 100) / 100;
  }

  copy(): LenientEnrollmentDraft {
    return new LenientEnrollmentDraft(this.code, this.name, this.sequence, this.ratio, this.createdAt, this.status);
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a lenient enrollment draft in status created. */
export function newLenientEnrollmentDraft(code: string, name: string): LenientEnrollmentDraft {
  return new LenientEnrollmentDraft(code, name, 0, 0, 0, "created");
}
