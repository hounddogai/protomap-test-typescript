import * as text from "../../../../kit/text.js";

/** Where a fallback sla adjustment is in its life cycle. */
export type FallbackSlaAdjustmentStatus = "created" | "validated" | "published" | "retired";

/** A fallback sla adjustment as the sla team keeps it. */
export class FallbackSlaAdjustment {
  code: string;
  title: string;
  revision: number;
  batchSize: number;
  source: string;
  locale: string;
  status: FallbackSlaAdjustmentStatus;

  constructor(
    code: string,
    title: string,
    revision: number,
    batchSize: number,
    source: string,
    locale: string,
    status: FallbackSlaAdjustmentStatus,
  ) {
    this.code = code;
    this.title = title;
    this.revision = revision;
    this.batchSize = batchSize;
    this.source = source;
    this.locale = locale;
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

  canMoveTo(next: FallbackSlaAdjustmentStatus): boolean {
    switch (this.status) {
      case "created":
        switch (next) {
          case "validated":
          case "retired":
            return true;
        }
        return false;
      case "validated":
        switch (next) {
          case "published":
            return true;
        }
        return false;
      case "published":
        switch (next) {
          case "retired":
            return true;
        }
        return false;
    }
    return false;
  }

  moveTo(next: FallbackSlaAdjustmentStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`fallback sla adjustment ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} [${this.title}]`;
  }

  netTotal(): number {
    return Math.round(this.revision * this.batchSize * 100) / 100;
  }

  copy(): FallbackSlaAdjustment {
    return new FallbackSlaAdjustment(
      this.code,
      this.title,
      this.revision,
      this.batchSize,
      this.source,
      this.locale,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.source);
  }
}

/** Starts a fallback sla adjustment in status created. */
export function newFallbackSlaAdjustment(code: string, title: string): FallbackSlaAdjustment {
  return new FallbackSlaAdjustment(code, title, 0, 0, "", "", "created");
}
