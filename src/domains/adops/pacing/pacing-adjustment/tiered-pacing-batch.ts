import * as text from "../../../../kit/text.js";

/** Where a tiered pacing batch is in its life cycle. */
export type TieredPacingBatchStatus = "created" | "validated" | "published" | "retired";

/** One tiered pacing batch, with what the planners need to act on it. */
export class TieredPacingBatch {
  code: string;
  title: string;
  graceDays: number;
  score: number;
  phone: string;
  locale: string;
  checksum: string;
  status: TieredPacingBatchStatus;

  constructor(
    code: string,
    title: string,
    graceDays: number,
    score: number,
    phone: string,
    locale: string,
    checksum: string,
    status: TieredPacingBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.graceDays = graceDays;
    this.score = score;
    this.phone = phone;
    this.locale = locale;
    this.checksum = checksum;
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

  canMoveTo(next: TieredPacingBatchStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        return next === "retired";
      case "published":
        return next === "retired";
    }
    return false;
  }

  moveTo(next: TieredPacingBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tiered pacing batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"tiered pacing batch"} ${this.code}`;
  }

  projectedVolume(): number {
    return Math.round(this.graceDays * this.score * 100) / 100;
  }

  copy(): TieredPacingBatch {
    return new TieredPacingBatch(
      this.code,
      this.title,
      this.graceDays,
      this.score,
      this.phone,
      this.locale,
      this.checksum,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tiered pacing batch in status created. */
export function newTieredPacingBatch(code: string, title: string): TieredPacingBatch {
  return new TieredPacingBatch(code, title, 0, 0, "", "", "", "created");
}
