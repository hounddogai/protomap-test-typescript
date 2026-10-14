import * as text from "../../../../kit/text.js";

/** Where a sla batch is in its life cycle. */
export type SlaBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** The record of a sla batch and its current status. */
export class SlaBatch {
  code: string;
  title: string;
  limit: number;
  name: string;
  retries: number;
  threshold: number;
  status: SlaBatchStatus;

  constructor(
    code: string,
    title: string,
    limit: number,
    name: string,
    retries: number,
    threshold: number,
    status: SlaBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.limit = limit;
    this.name = name;
    this.retries = retries;
    this.threshold = threshold;
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

  canMoveTo(next: SlaBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
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
        return next === "expired";
    }
    return false;
  }

  moveTo(next: SlaBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`sla batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
  }

  label(): string {
    return `${"sla batch"} ${this.code}`;
  }

  adjustedValue(): number {
    return Math.round(this.retries * this.threshold * 100) / 100;
  }

  copy(): SlaBatch {
    return new SlaBatch(this.code, this.title, this.limit, this.name, this.retries, this.threshold, this.status);
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a sla batch in status requested. */
export function newSlaBatch(code: string, title: string): SlaBatch {
  return new SlaBatch(code, title, 0, "", 0, 0, "requested");
}
