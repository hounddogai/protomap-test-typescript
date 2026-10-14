import * as text from "../../../../kit/text.js";

/** Where a mention batch is in its life cycle. */
export type MentionBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** One mention batch, with what the planners need to act on it. */
export class MentionBatch {
  code: string;
  name: string;
  maximum: number;
  ceiling: number;
  startsAt: number;
  active: boolean;
  rate: number;
  description: string;
  status: MentionBatchStatus;

  constructor(
    code: string,
    name: string,
    maximum: number,
    ceiling: number,
    startsAt: number,
    active: boolean,
    rate: number,
    description: string,
    status: MentionBatchStatus,
  ) {
    this.code = code;
    this.name = name;
    this.maximum = maximum;
    this.ceiling = ceiling;
    this.startsAt = startsAt;
    this.active = active;
    this.rate = rate;
    this.description = description;
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

  canMoveTo(next: MentionBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        return next === "granted";
      case "granted":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: MentionBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`mention batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code} / ${this.name}`;
  }

  netValue(): number {
    return Math.round(this.ceiling * this.maximum * 100) / 100;
  }

  copy(): MentionBatch {
    return new MentionBatch(
      this.code,
      this.name,
      this.maximum,
      this.ceiling,
      this.startsAt,
      this.active,
      this.rate,
      this.description,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.name);
  }
}

/** Starts a mention batch in status requested. */
export function newMentionBatch(code: string, name: string): MentionBatch {
  return new MentionBatch(code, name, 0, 0, 0, false, 0, "", "requested");
}
