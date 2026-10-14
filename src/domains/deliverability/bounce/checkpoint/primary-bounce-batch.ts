import * as text from "../../../../kit/text.js";

/** Where a primary bounce batch is in its life cycle. */
export type PrimaryBounceBatchStatus = "requested" | "granted" | "revoked" | "expired";

/** A primary bounce batch. Its code is unique within a tenant. */
export class PrimaryBounceBatch {
  code: string;
  title: string;
  attempts: number;
  active: boolean;
  revision: number;
  attributes: Map<string, string>;
  quantity: number;
  retries: number;
  threshold: number;
  status: PrimaryBounceBatchStatus;

  constructor(
    code: string,
    title: string,
    attempts: number,
    active: boolean,
    revision: number,
    attributes: Map<string, string>,
    quantity: number,
    retries: number,
    threshold: number,
    status: PrimaryBounceBatchStatus,
  ) {
    this.code = code;
    this.title = title;
    this.attempts = attempts;
    this.active = active;
    this.revision = revision;
    this.attributes = attributes;
    this.quantity = quantity;
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

  canMoveTo(next: PrimaryBounceBatchStatus): boolean {
    switch (this.status) {
      case "requested":
        switch (next) {
          case "granted":
          case "expired":
            return true;
        }
        return false;
      case "granted":
        return next === "revoked" || next === "expired";
      case "revoked":
        return next === "expired";
    }
    return false;
  }

  moveTo(next: PrimaryBounceBatchStatus): void {
    if (!this.canMoveTo(next)) {
      throw new Error(`primary bounce batch ${this.code} cannot move from ${this.status} to ${next}`);
    }
    this.status = next;
    this.revision += 1;
  }

  label(): string {
    return `${this.code} / ${this.title}`;
  }

  attribute(key: string, fallback: string): string {
    const found = this.attributes.get(key);
    if (found === undefined) return fallback;
    if (found.trim() === "") return fallback;
    return found;
  }

  netTotal(): number {
    return Math.round(this.attempts * this.threshold * 100) / 100;
  }

  copy(): PrimaryBounceBatch {
    return new PrimaryBounceBatch(
      this.code,
      this.title,
      this.attempts,
      this.active,
      this.revision,
      this.attributes,
      this.quantity,
      this.retries,
      this.threshold,
      this.status,
    );
  }

  groupKey(): string {
    return text.normalize(this.title);
  }
}

/** Starts a primary bounce batch in status requested. */
export function newPrimaryBounceBatch(code: string, title: string): PrimaryBounceBatch {
  return new PrimaryBounceBatch(code, title, 0, false, 0, new Map<string, string>(), 0, 0, 0, "requested");
}
