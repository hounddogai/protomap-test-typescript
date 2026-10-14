import * as text from "../../../../kit/text.js";

/** Where a tier batch is in its life cycle. */
export type TierBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** A tier batch. Its code is unique within a tenant. */
export class TierBatch {
  code: string;
  title: string;
  visible: boolean;
  startsAt: number;
  locale: string;
  threshold: number;
  sequence: number;
  ratio: number;
  status: TierBatchStatus;

  constructor(
    code: string,
    title: string,
    visible: boolean,
    startsAt: number,
    locale: string,
    threshold: number,
    sequence: number,
    ratio: number,
    status: TierBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.visible = visible;
    this.startsAt = startsAt;
    this.locale = locale;
    this.threshold = threshold;
    this.sequence = sequence;
    this.ratio = ratio;
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

  canMoveTo(next: TierBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "expired":
            return true;
        }
        return false;
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

  moveTo(next: TierBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`tier batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.startsAt = Math.floor(Date.now() / 1000);
  }

  label(): string {
    return `${this.code}: ${this.title}`;
  }

  adjustedValue(): number {
    return Math.round((this.sequence + this.threshold) * 100) / 100;
  }

  copy(): TierBatch {
    return new TierBatch(
      this.code,
      this.title,
      this.visible,
      this.startsAt,
      this.locale,
      this.threshold,
      this.sequence,
      this.ratio,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.locale);
  }
}

/** Starts a tier batch in status requested. */
export function newTierBatch(code: string, title: string): TierBatch {
  return new TierBatch(code, title, false, 0, "", 0, 0, 0, "requested");
}
